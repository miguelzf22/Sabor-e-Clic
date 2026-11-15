import { useEffect, useState } from 'react'
import { Header } from '../../Components/Header'
import { ImageUploader } from '../../Components/ImageUploader'
import { setRestaurantImage, setDishImage, createRestaurant, renameRestaurant } from '../../authSession'
import './Restaurants.css'

export const Restaurants=()=>{
    const [restaurants,setRestaurants]=useState([])
    const [status,setStatus]=useState('loading') // loading | ready | error
    const [selected,setSelected]=useState(null) // restaurante carregado com pratos
    const [novoNome,setNovoNome]=useState('')
    const [criando,setCriando]=useState(false)
    const [erro,setErro]=useState('')
    const [editandoId,setEditandoId]=useState(null) // id do restaurante em edição de nome
    const [nomeEdit,setNomeEdit]=useState('')
    const [salvandoNome,setSalvandoNome]=useState(false)

    const carregar=()=>{
        fetch('/api/restaurantes')
            .then(async (r)=>{ const d=await r.json(); if(!r.ok) throw new Error(); return d.restaurantes })
            .then((list)=>{ setRestaurants(list); setStatus('ready') })
            .catch(()=>setStatus('error'))
    }

    useEffect(()=>{ carregar() },[])

    const criar=async (e)=>{
        e.preventDefault()
        if(criando || !novoNome.trim()) return
        setCriando(true); setErro('')
        try{
            await createRestaurant(novoNome.trim())
            setNovoNome('')
            carregar()
        }catch(err){ setErro(err.message) }
        finally{ setCriando(false) }
    }

    const abrir=async (id)=>{
        setSelected({ id, loading:true })
        try{
            const r=await fetch(`/api/restaurantes/${id}`)
            const d=await r.json()
            if(!r.ok) throw new Error()
            setSelected(d.restaurante)
        }catch{
            setSelected({ id, erro:true })
        }
    }

    const iniciarEdicao=(rest)=>{ setEditandoId(rest.id); setNomeEdit(rest.nome); setErro('') }
    const cancelarEdicao=()=>{ setEditandoId(null); setNomeEdit('') }
    const salvarNome=async (rest)=>{
        if(salvandoNome || !nomeEdit.trim()) return
        setSalvandoNome(true); setErro('')
        try{
            await renameRestaurant(rest.id, nomeEdit.trim())
            setEditandoId(null); setNomeEdit('')
            carregar()
        }catch(err){ setErro(err.message) }
        finally{ setSalvandoNome(false) }
    }

    return(
        <main id='conteudo-principal' className='restaurantsPage'>
            <Header/>
            <div className='restaurantsContent'>
                <h1>Restaurantes</h1>
                <form className='restaurantsCreate' onSubmit={criar}>
                    <input
                        value={novoNome}
                        onChange={(e)=>setNovoNome(e.target.value)}
                        placeholder='Nome do novo restaurante'
                        maxLength={30}
                        aria-label='Nome do novo restaurante'
                    />
                    <button type='submit' disabled={criando}>{criando ? 'Criando…' : 'Criar restaurante'}</button>
                </form>
                {erro && <p role='alert' className='restaurantsError'>{erro}</p>}
                {status==='loading' && <p role='status'>Carregando restaurantes…</p>}
                {status==='error' && <p role='alert'>Não foi possível carregar os restaurantes.</p>}
                {status==='ready' && (
                    <div className='restaurantsGrid'>
                        {restaurants.map((rest)=>(
                            <section key={rest.id} className='restaurantsCard'>
                                {editandoId===rest.id ? (
                                    <div className='restaurantsRename'>
                                        <input
                                            value={nomeEdit}
                                            onChange={(e)=>setNomeEdit(e.target.value)}
                                            maxLength={30}
                                            aria-label='Novo nome do restaurante'
                                            autoFocus
                                        />
                                        <div className='restaurantsRenameActions'>
                                            <button type='button' onClick={()=>salvarNome(rest)} disabled={salvandoNome || !nomeEdit.trim()}>
                                                {salvandoNome ? 'Salvando…' : 'Salvar'}
                                            </button>
                                            <button type='button' className='restaurantsRenameCancel' onClick={cancelarEdicao}>Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='restaurantsCardTitle'>
                                        <h2>{rest.nome}</h2>
                                        <button type='button' className='restaurantsRenameBtn' onClick={()=>iniciarEdicao(rest)}>Editar nome</button>
                                    </div>
                                )}
                                <ImageUploader
                                    current={rest.imagem}
                                    label='foto'
                                    shape='square'
                                    onUpload={(key)=>setRestaurantImage(rest.id,key).catch(()=>{})}
                                />
                                <button type='button' className='restaurantsDishesToggle' onClick={()=>abrir(rest.id)}>
                                    {selected?.id===rest.id ? 'Recarregar pratos' : 'Gerenciar pratos'}
                                </button>
                                {selected?.id===rest.id && selected.loading && <p role='status'>Carregando pratos…</p>}
                                {selected?.id===rest.id && selected.erro && <p role='alert'>Falha ao carregar pratos.</p>}
                                {selected?.id===rest.id && selected.pratos && (
                                    <ul className='restaurantsDishes'>
                                        {selected.pratos.map((prato)=>(
                                            <li key={prato.id}>
                                                <span>{prato.nome}</span>
                                                <ImageUploader
                                                    current={prato.imagem}
                                                    label='foto'
                                                    shape='square'
                                                    onUpload={(key)=>setDishImage(prato.id,key).catch(()=>{})}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
