from zxcvbn import zxcvbn
import re

# Siglas das 27 unidades federativas do Brasil (26 estados + DF).
UFS_BRASIL = frozenset({
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
})

# CEP brasileiro: 8 dígitos com hífen opcional antes dos 3 últimos (00000-000 ou 00000000).
_CEP_REGEX = re.compile(r"^\d{5}-?\d{3}$")

def check_email(email: str):
    """Verifica o formato do email"""
    email_format = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}"
    return isinstance(email, str) and bool(re.fullmatch(email_format, email))

def check_cep(cep: str):
    """Verifica se o CEP está no formato brasileiro (00000-000 ou 00000000)."""
    return isinstance(cep, str) and bool(_CEP_REGEX.fullmatch(cep.strip()))

def check_uf(uf: str):
    """Verifica se a sigla é uma unidade federativa brasileira válida."""
    return isinstance(uf, str) and uf.strip().upper() in UFS_BRASIL

def check_address_number(numero: str):
    """Número do endereço: não vazio, até 5 caracteres, apenas dígitos ou S/N."""
    if not isinstance(numero, str):
        return False
    valor = numero.strip()
    if not valor or len(valor) > 5:
        return False
    return valor.isdigit() or valor.upper() in {"S/N", "SN"}

def check_pwd_strength(pwd: str,usr_imp):
    """Verifica a força da senha, retorna bool"""
    if not pwd or len(pwd) < 8:
        return False
    return zxcvbn(pwd,user_inputs=(usr_imp or []))['score'] >=3

def check_json(data):
    """Verifica se o dado está formatado em json"""
    return isinstance(data, dict)