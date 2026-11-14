"""Reinicia o banco de dados: APAGA TUDO e roda o seed de demonstração em seguida.

Uso (a partir de api/, com o venv ativo):

    python reset_db.py --yes          # apaga tudo e semeia (pede --yes de propósito)
    python reset_db.py                # mostra o alvo e aborta (não destrói sem --yes)

O que faz, em uma transação por etapa:
  1. Resolve o banco a partir da MESMA config do app (DATABASE_URL do .env; no
     setup atual, aponta para o Neon).
  2. Dropa o esquema inteiro (Postgres: DROP SCHEMA public CASCADE + recria;
     SQLite: db.drop_all()). Isso remove TODAS as tabelas, inclusive a
     alembic_version, para um estado limpo de verdade.
  3. Recria o esquema aplicando as migrações do Alembic até o head (nunca via
     create_all, para manter paridade com produção: triggers etc.).
  4. Roda o seed de demonstração (seed_demo.seed()).

SEGURANÇA:
  - Operação DESTRUTIVA e irreversível: exige a flag --yes.
  - NUNCA roda em produção: se APP_ENV=production (ou ENVIRONMENT=production),
    aborta. O seed também recusa produção por conta própria (SEC-004).
  - Imprime o host/alvo do banco antes de agir, para você conferir que não é o
    banco errado.
"""
import sys
from urllib.parse import urlsplit

from sqlalchemy import text

from app import create_app
from extensions import db
from migrations import run_migrations
import seed_demo


def _target_descricao(uri: str) -> str:
    """Descrição legível e SEM segredos do alvo (host/banco), para confirmação."""
    try:
        parts = urlsplit(uri)
        if parts.scheme.startswith("sqlite"):
            return f"SQLite: {parts.path or uri}"
        host = parts.hostname or "?"
        dbname = (parts.path or "").lstrip("/") or "?"
        return f"{parts.scheme} em {host}/{dbname}"
    except Exception:
        # Nunca ecoar a URI crua (pode conter credenciais).
        return "banco configurado (detalhes ocultos)"


def _wipe(app) -> None:
    """Remove todas as tabelas do banco (dialeto-aware)."""
    with app.app_context():
        dialect = db.engine.dialect.name
        if dialect == "postgresql":
            # Dropar o schema é mais completo que drop_all: leva junto a
            # alembic_version e qualquer objeto fora do metadata do SQLAlchemy.
            with db.engine.begin() as conn:
                conn.execute(text("DROP SCHEMA public CASCADE"))
                conn.execute(text("CREATE SCHEMA public"))
        else:
            # SQLite (dev/local): derruba o que o metadata conhece e a versão do Alembic.
            db.drop_all()
            with db.engine.begin() as conn:
                conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        db.session.remove()
        # Zera pools para não reaproveitar conexões presas ao schema antigo.
        db.engine.dispose()


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    confirmado = "--yes" in argv or "-y" in argv

    app = create_app()

    ambiente = app.config.get("ENVIRONMENT")
    if ambiente in {"production", "prod"}:
        print("ABORTADO: reset_db não roda em produção.", file=sys.stderr)
        return 2

    uri = app.config.get("SQLALCHEMY_DATABASE_URI") or ""
    alvo = _target_descricao(uri)

    print("=== Reiniciar banco de dados (APAGA TUDO + seed) ===")
    print(f"Ambiente: {ambiente}")
    print(f"Alvo:     {alvo}")

    if not confirmado:
        print(
            "\nNada foi alterado. Esta operação é DESTRUTIVA.\n"
            "Rode novamente com --yes para confirmar:\n"
            "    python reset_db.py --yes",
            file=sys.stderr,
        )
        return 1

    print("\n[1/3] Apagando todas as tabelas…")
    _wipe(app)

    print("[2/3] Recriando o esquema (migrações Alembic até head)…")
    run_migrations(app)

    print("[3/3] Semeando dados de demonstração…")
    with app.app_context():
        seed_demo.seed()

    print("\nBanco reiniciado com sucesso.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
