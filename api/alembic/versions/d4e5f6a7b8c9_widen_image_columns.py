"""widen image/avatar columns to fit Vercel Blob URLs (STOR-001)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-11-13 22:15:00.000000

Motivo: com STORAGE_BACKEND=blob (produção), a "chave" persistida é a URL pública
absoluta do Vercel Blob (~95+ chars). As colunas eram String(100), curtas demais:
a validação/DB rejeitava a URL e a troca de foto não persistia. Alarga para 512.
"""
from alembic import op
import sqlalchemy as sa


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


# (tabela, coluna) com imagem/avatar que guardam a chave/URL do storage.
_COLUNAS = [
    ("restaurante", "imagem"),
    ("prato", "imagem"),
    ("ingrediente", "imagem"),
    ("funcionario", "avatar"),
    ("cozinheiro", "avatar"),
    ("cliente", "avatar"),
]


def upgrade():
    # render_as_batch já está ativo no env.py (seguro para ALTER no SQLite).
    for tabela, coluna in _COLUNAS:
        with op.batch_alter_table(tabela, schema=None) as batch_op:
            batch_op.alter_column(
                coluna,
                existing_type=sa.String(length=100),
                type_=sa.String(length=512),
                existing_nullable=True,
            )


def downgrade():
    for tabela, coluna in _COLUNAS:
        with op.batch_alter_table(tabela, schema=None) as batch_op:
            batch_op.alter_column(
                coluna,
                existing_type=sa.String(length=512),
                type_=sa.String(length=100),
                existing_nullable=True,
            )
