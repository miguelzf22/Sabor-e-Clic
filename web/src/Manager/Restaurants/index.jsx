import { useEffect, useState } from 'react'
import { Header } from '../../Components/Header'
import { ImageUploader } from '../../Components/ImageUploader'
import { setRestaurantImage, setDishImage, createRestaurant, renameRestaurant, fetchIngredients, updateDish } from '../../authSession'
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
    const [ingredientes,setIngredientes]=useState([]) // estoque disponível (para o seletor Nome)
    const [pratoEditando,setPratoEditando]=useState(null) // id do prato com ingredientes em edição
    const [formIngs,setFormIngs]=useState([]) // linhas de ingrediente do prato em edição
    const [salvandoPrato,setSalvandoPrato]=useState(false)

    const carregar=()=>{
        fetch('/api/restaurantes')
            .then(async (r)=>{ const d=await r.json(); if(!r.ok) throw new Error(); return d.restaurantes })
            .then((list)=>{ setRestaurants(list); setStatus('ready') })
            .catch(()=>setStatus('error'))
    }

    useEffect(()=>{ carregar() },[])
    // Carrega o estoque uma vez: alimenta o seletor "Nome" dos ingredientes.
    useEffect(()=>{ fetchIngredients().then(setIngredientes).catch(()=>setIngredientes([])) },[])

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
        setPratoEditando(null)
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

    // --- edição de ingredientes do prato ---
    const abrirEdicaoPrato=(prato)=>{
        setErro('')
        setPratoEditando(prato.id)
        setFormIngs((prato.ingredientes || []).map((i)=>({
            id_ingrediente:i.id_ingrediente, unidade_medida:i.unidade_medida, qtd:String(i.qtd),
        })))
    }
    const cancelarEdicaoPrato=()=>{ setPratoEditando(null); setFormIngs([]) }
    const addIng=()=>setFormIngs((f)=>[...f,{ id_ingrediente:ingredientes[0]?.id, unidade_medida:'un', qtd:'1' }])
    const setIng=(idx,campo,valor)=>setFormIngs((f)=>f.map((ing,i)=>i===idx ? { ...ing, [campo]:valor } : ing))
    const removeIng=(idx)=>setFormIngs((f)=>f.filter((_,i)=>i!==idx))
    const salvarPrato=async (prato)=>{
        if(salvandoPrato) return
        setSalvandoPrato(true); setErro('')
        try{
            await updateDish(prato.id,{
                ingredientes:formIngs
                    .filter((i)=>Number.isInteger(i.id_ingrediente))
                    .map((i)=>({ id_ingrediente:i.id_ingrediente, unidade_medida:i.unidade_medida, qtd:String(i.qtd) })),
            })
            setPratoEditando(null); setFormIngs([])
            await abrir(selected.id) // recarrega os pratos do restaurante aberto
        }catch(err){ setErro(err.fields ? Object.values(err.fields).join(' ') : err.message) }
        finally{ setSalvandoPrato(false) }
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
                                                <span className='restaurantsDishName'>{prato.nome}</span>
                                                <ImageUploader
                                                    current={prato.imagem}
                                                    label='foto'
                                                    shape='square'
                                                    onUpload={(key)=>setDishImage(prato.id,key).catch(()=>{})}
                                                />
                                                {pratoEditando===prato.id ? (
                                                    <div className='restaurantsIngs'>
                                                        {formIngs.length===0 && <p className='restaurantsHint'>Nenhum ingrediente. Adicione abaixo.</p>}
                                                        {formIngs.map((ing,idx)=>(
                                                            <fieldset key={idx} className='restaurantsIngRow'>
                                                                <legend className='restaurantsIngLegend'>
                                                                    <span>Ingrediente {idx+1}</span>
                                                                    <button type='button' className='restaurantsIngRemove' onClick={()=>removeIng(idx)}>Remover</button>
                                                                </legend>
                                                                <label>Nome
                                                                    <select value={ing.id_ingrediente} onChange={(e)=>setIng(idx,'id_ingrediente',Number(e.target.value))}>
                                                                        {ingredientes.map((i)=>(<option key={i.id} value={i.id}>{i.nome}</option>))}
                                                                    </select>
                                                                </label>
                                                                <label>Quantidade
                                                                    <input type='number' step='0.01' min='0' value={ing.qtd} onChange={(e)=>setIng(idx,'qtd',e.target.value)}/>
                                                                </label>
                                                                <label>Unidade
                                                                    <input value={ing.unidade_medida} maxLength={20} onChange={(e)=>setIng(idx,'unidade_medida',e.target.value)}/>
                                                                </label>
                                                            </fieldset>
                                                        ))}
                                                        <div className='restaurantsIngActions'>
                                                            <button type='button' onClick={addIng} disabled={!ingredientes.length}>+ Adicionar ingrediente</button>
                                                            <button type='button' onClick={()=>salvarPrato(prato)} disabled={salvandoPrato}>{salvandoPrato ? 'Salvando…' : 'Salvar ingredientes'}</button>
                                                            <button type='button' className='restaurantsIngCancel' onClick={cancelarEdicaoPrato}>Cancelar</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ul className='restaurantsIngList'>
                                                            {(prato.ingredientes || []).length===0
                                                                ? <li className='restaurantsHint'>Sem ingredientes.</li>
                                                                : prato.ingredientes.map((i)=>(<li key={i.id_ingrediente}>{`${i.qtd} ${i.unidade_medida} · ${i.nome}`}</li>))}
                                                        </ul>
                                                        <button type='button' className='restaurantsIngEdit' onClick={()=>abrirEdicaoPrato(prato)}>Editar ingredientes</button>
                                                    </>
                                                )}
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
