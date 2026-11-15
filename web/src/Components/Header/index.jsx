import { useEffect, useId, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { House, Moon, PlantIcon, ShoppingCartIcon, Sun, UserIcon, GearIcon, SquaresFourIcon, CookingPotIcon, ForkKnifeIcon, UsersThreeIcon, PackageIcon, ListIcon, XIcon } from '@phosphor-icons/react'
import { useAuth } from '../../authContext'
import { useTheme } from '../../themeContext'
import { Banner } from '../../Assets/Banner'
import { CartDrawer } from '../CartDrawer'
import { Avatar } from '../Avatar'
import { SkipLink } from '../SkipLink'
import './Header.css'

// Fonte única dos links de navegação por papel. Desktop renderiza inline;
// mobile renderiza os mesmos itens dentro do menu suspenso (estilo AWS).
const buildNavLinks=(role)=>{
    const links=[]
    if(role==='admin') links.push({ to:'/gerente', label:'Gerência', Icon:SquaresFourIcon })
    if(role==='cook') links.push({ to:'/cozinha/minhas-cozinhas', label:'Minhas cozinhas', Icon:SquaresFourIcon })
    if(role==='customer') links.push({ to:'/catalogo/bancadas', label:'Bancadas', Icon:ForkKnifeIcon })
    if(role==='cook') links.push({ to:'/cozinha', label:'Cozinha', Icon:CookingPotIcon })
    if(role==='admin') links.push({ to:'/gerente/staff', label:'Equipe', Icon:UsersThreeIcon })
    if(role==='admin') links.push({ to:'/gerente/estoque', label:'Estoque', Icon:PackageIcon })
    if(role==='cook' || role==='admin') links.push({ to:'/cozinha/bancadas', label:'Bancadas', Icon:ForkKnifeIcon })
    if(role==='cook') links.push({ to:'/cozinha/pratos', label:'Meus pratos', Icon:CookingPotIcon })
    links.push({ to:'/configuracoes', label:'Configurações', Icon:GearIcon })
    links.push({ to:'/', label:'Início', Icon:House })
    return links
}

export const Header=()=>{

    const [cartOpen,setCartOpen]=useState(false)
    const [menuOpen,setMenuOpen]=useState(false)
    const { user } = useAuth()
    const { effective, setPreference } = useTheme()
    const isDark = effective === 'dark'
    const userName = user?.nome?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'usuário'
    const menuId = useId()
    const menuRef = useRef(null)
    const menuBtnRef = useRef(null)

    const navLinks = user ? buildNavLinks(user.role) : []

    // Alterna rapidamente entre claro/escuro; a opção 'sistema' fica em Configurações.
    const toggleTheme = () => setPreference(isDark ? 'light' : 'dark')

    // Menu mobile: fecha em Esc, em clique fora e ao navegar.
    useEffect(()=>{
        if(!menuOpen) return
        const onKey=(e)=>{ if(e.key==='Escape'){ setMenuOpen(false); menuBtnRef.current?.focus() } }
        const onClickOutside=(e)=>{
            if(menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current?.contains(e.target)){
                setMenuOpen(false)
            }
        }
        window.addEventListener('keydown',onKey)
        document.addEventListener('mousedown',onClickOutside)
        return ()=>{
            window.removeEventListener('keydown',onKey)
            document.removeEventListener('mousedown',onClickOutside)
        }
    },[menuOpen])

    return(
        <>
            <SkipLink/>
            <header className='header'>
                <Banner/>
                <nav className='headerNav px-3 md:px-6 lg:px-10'>
                    <NavLink to='/' className='headerLogo'>
                        {/*Placeholder do logo*/}
                        <PlantIcon className='headerLogoIcon' weight='fill'/>
                        <span className='headerLogoText'>
                            <span>Sabor</span>
                            <span>&</span>
                            <span>Click</span>
                        </span>
                    </NavLink>

                    {/*A barra de pesquisa entra aqui*/}

                    <div className='headerActions gap-2 sm:gap-4 md:gap-8'>
                        {user ? <>
                            <NavLink to='/perfil' className='headerGreeting'>
                                <Avatar src={user.avatar} name={user.nome || user.email} size={26}/>
                                <span>Olá, {userName}!</span>
                            </NavLink>
                            {/* Desktop: links inline (ocultos no mobile via CSS) */}
                            <div className='headerLinks'>
                                {navLinks.map(({ to, label, Icon })=>(
                                    <NavLink key={to+label} to={to} end={to==='/'} className='headerHome'>
                                        <Icon className='headerIcon'/>
                                        <span className='hidden sm:inline'>{label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </> : <NavLink to='/login' className='headerAccount'>
                            <UserIcon className='headerIcon'/>
                            <span className='hidden sm:inline'>Acessar Conta</span>
                        </NavLink>}
                        <button
                            type='button'
                            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                            title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                            className='headerTheme'
                            onClick={toggleTheme}
                        >
                            {isDark ? <Moon className='headerIcon' weight='fill'/> : <Sun className='headerIcon' weight='fill'/>}
                        </button>
                        <button type='button' aria-label='Abrir carrinho' className='headerCart' onClick={()=>setCartOpen(true)}>
                            <ShoppingCartIcon className='headerIcon'/>
                        </button>
                        {/* Mobile: botão que abre o menu suspenso com os links de navegação */}
                        {user && (
                            <div className='headerMenu'>
                                <button
                                    type='button'
                                    ref={menuBtnRef}
                                    className='headerMenuBtn'
                                    aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                                    aria-haspopup='menu'
                                    aria-expanded={menuOpen}
                                    aria-controls={menuId}
                                    onClick={()=>setMenuOpen((o)=>!o)}
                                >
                                    {menuOpen ? <XIcon className='headerIcon'/> : <ListIcon className='headerIcon'/>}
                                </button>
                                {menuOpen && (
                                    <div ref={menuRef} id={menuId} role='menu' className='headerMenuPanel'>
                                        <NavLink to='/perfil' role='menuitem' className='headerMenuItem' onClick={()=>setMenuOpen(false)}>
                                            <Avatar src={user.avatar} name={user.nome || user.email} size={22}/>
                                            <span>Olá, {userName}!</span>
                                        </NavLink>
                                        {navLinks.map(({ to, label, Icon })=>(
                                            <NavLink
                                                key={to+label}
                                                to={to}
                                                end={to==='/'}
                                                role='menuitem'
                                                className='headerMenuItem'
                                                onClick={()=>setMenuOpen(false)}
                                            >
                                                <Icon className='headerIcon'/>
                                                <span>{label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </nav>
            </header>
            <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)}/>
        </>
    )
}
