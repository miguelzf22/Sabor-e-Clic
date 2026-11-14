import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MinusIcon, PlusIcon } from '@phosphor-icons/react'
import { formatCurrency } from '../utils/formatCurrency'
import { fetchDishReviews } from '../authSession'
import { useCart } from '../cartContext'
import { Header } from '../Components/Header'
import { NextBtn } from '../Components/NextBtn'
import './Dish.css'

const MIN_QTY = 1
const MAX_QTY = 99

function formatDate(iso){
    if(!iso) return ''
    const d=new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

// Normaliza qualquer entrada para um inteiro dentro de [MIN_QTY, MAX_QTY].
function clampQty(value){
    const n=Math.floor(Number(value))
    if(!Number.isFinite(n)) return MIN_QTY
    return Math.min(MAX_QTY, Math.max(MIN_QTY, n))
}

export const Dish=()=>{

    const { slugRest, slugPrato }=useParams()
    const [quantity,setQuantity]=useState(MIN_QTY)
    const [qtyText,setQtyText]=useState(String(MIN_QTY)) // valor cru do input (permite vazio enquanto digita)
    const [dish,setDish]=useState(null)
    const [status,setStatus]=useState('loading')
    const [added,setAdded]=useState(false)
    const [tab,setTab]=useState('detalhes') // detalhes | avaliacoes
    const [reviews,setReviews]=useState(null) // { media, total, avaliacoes }
    const [reviewsStatus,setReviewsStatus]=useState('loading') // loading | ready | error
    const { addItem }=useCart()

    const unavailable=dish?.disponivel===false

    useEffect(() => {
        let active = true
        fetch(`/api/restaurantes/${encodeURIComponent(slugRest)}/pratos/${encodeURIComponent(slugPrato)}`)
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok) throw new Error(data.error?.message || 'Prato não encontrado.')
                return data.prato
            })
            .then((item) => { if (active) { setDish(item); setStatus('ready') } })
            .catch(() => { if (active) setStatus('error') })
        return () => { active = false }
    }, [slugRest, slugPrato])

    useEffect(() => {
        if (!dish) return
        let active = true
        fetchDishReviews(dish.id)
            .then((r) => { if (active) { setReviews(r); setReviewsStatus('ready') } })
            .catch(() => { if (active) setReviewsStatus('error') })
        return () => { active = false }
    }, [dish])

    // Atualiza a quantidade (número) e o texto exibido de forma consistente.
    const commitQty=(value)=>{
        const q=clampQty(value)
        setQuantity(q)
        setQtyText(String(q))
    }
    const step=(delta)=>commitQty(quantity+delta)

    if(status === 'loading'){
        return <main id='conteudo-principal' className='dishPage'><Header/><p>Carregando prato…</p></main>
    }
    if(status === 'error' || !dish){
        return(
            <main id='conteudo-principal' className='dishPage'>
                <Header/>
                <h1>Prato não encontrado :/</h1>
                <Link to='/'>Voltar para o início</Link>
            </main>
        )
    }

    return(
        <main id='conteudo-principal' className='dishPage'>
            <Header/>
            {/*Imagem do prato (gradiente placeholder quando ausente)*/}
            <section className='dishPageImg h-[200px] md:h-[320px]' style={dish.imagem ? { backgroundImage: `url(${dish.imagem})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}></section>

            <section className='dishPageInfo px-4'>
                <h1 className='dishPageName text-[32px] md:text-[40px]'>{dish.nome}</h1>
                {reviews && reviews.total > 0 && (
                    <p className='dishPageRatingSummary'>{`★ ${reviews.media} · ${reviews.total} avaliação${reviews.total === 1 ? '' : 'es'}`}</p>
                )}
                {dish.descricao && <p className='dishPageDescription'>{dish.descricao}</p>}
            </section>

            {/* Abas: detalhes do prato e avaliações */}
            <div className='dishPageTabs' role='tablist' aria-label='Seções do prato'>
                <button
                    role='tab'
                    aria-selected={tab === 'detalhes'}
                    className={`dishPageTab ${tab === 'detalhes' ? 'is-active' : ''}`}
                    onClick={()=>setTab('detalhes')}
                >
                    Detalhes
                </button>
                <button
                    role='tab'
                    aria-selected={tab === 'avaliacoes'}
                    className={`dishPageTab ${tab === 'avaliacoes' ? 'is-active' : ''}`}
                    onClick={()=>setTab('avaliacoes')}
                >
                    Avaliações{reviews && reviews.total > 0 ? ` (${reviews.total})` : ''}
                </button>
            </div>

            {/* Detalhes: categorias | ingredientes | preço + adicionar */}
            {tab === 'detalhes' && (
                <section className='dishPageDetails px-4'>
                    <div className='dishPageGroup grid grid-cols-1 md:grid-cols-3 gap-8'>
                        <div className='dishPageBlock dishPageCategories'>
                            <h2>Categorias</h2>
                            {dish.categorias.length ? (
                                <ul>{dish.categorias.map((c)=>(<li key={c}>{c}</li>))}</ul>
                            ) : <p className='dishPageEmpty'>Sem categorias.</p>}
                        </div>

                        <div className='dishPageBlock dishPageIngredients'>
                            <h2>Ingredientes</h2>
                            {dish.ingredientes.length ? (
                                <ul>{dish.ingredientes.map((i)=>(<li key={i.id_ingrediente}>{`${i.qtd} ${i.unidade_medida} · ${i.nome}`}</li>))}</ul>
                            ) : <p className='dishPageEmpty'>Sem ingredientes cadastrados.</p>}
                        </div>

                        <div className='dishPageBlock dishPagePurchase'>
                            <p className='dishPagePrice'>{formatCurrency(Number(dish.preco))}</p>
                            <div className='dishPageQuantity'>
                                <span className='dishPageQuantityLabel'>Quantidade</span>
                                <div className='dishPageStepper'>
                                    <button
                                        type='button'
                                        className='dishPageStepBtn'
                                        aria-label='Diminuir quantidade'
                                        onClick={()=>step(-1)}
                                        disabled={unavailable || quantity<=MIN_QTY}
                                    >
                                        <MinusIcon/>
                                    </button>
                                    <input
                                        type='number'
                                        inputMode='numeric'
                                        min={MIN_QTY}
                                        max={MAX_QTY}
                                        step='1'
                                        value={qtyText}
                                        aria-label='Quantidade'
                                        disabled={unavailable}
                                        onChange={(e)=>{
                                            // Permite campo vazio enquanto digita; só dígitos.
                                            const raw=e.target.value.replace(/[^0-9]/g,'')
                                            setQtyText(raw)
                                            if(raw!=='') setQuantity(clampQty(raw))
                                        }}
                                        onBlur={()=>commitQty(qtyText===''?MIN_QTY:qtyText)}
                                    />
                                    <button
                                        type='button'
                                        className='dishPageStepBtn'
                                        aria-label='Aumentar quantidade'
                                        onClick={()=>step(1)}
                                        disabled={unavailable || quantity>=MAX_QTY}
                                    >
                                        <PlusIcon/>
                                    </button>
                                </div>
                            </div>
                            <NextBtn
                                type='button'
                                text='Adicionar ao carrinho'
                                disabled={unavailable}
                                onClick={()=>{
                                    const q=clampQty(qtyText===''?MIN_QTY:qtyText)
                                    commitQty(q)
                                    addItem({ id_prato: dish.id, nome: dish.nome, preco: Number(dish.preco), quantity: q, imagem: dish.imagem })
                                    setAdded(true)
                                }}
                            />
                            <p className='dishPageFeedback' role='status' aria-live='polite'>
                                {unavailable
                                    ? 'Este prato está indisponível no momento.'
                                    : (added ? `${quantity} × ${dish.nome} adicionado ao carrinho.` : '')}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Avaliações do prato */}
            {tab === 'avaliacoes' && (
                <section className='dishPageReviews px-4'>
                    {reviewsStatus === 'loading' && <p className='dishPageEmpty'>Carregando avaliações…</p>}
                    {reviewsStatus === 'error' && <p className='dishPageEmpty' role='alert'>Não foi possível carregar as avaliações.</p>}
                    {reviewsStatus === 'ready' && reviews && reviews.total === 0 && <p className='dishPageEmpty'>Este prato ainda não tem avaliações.</p>}
                    {reviewsStatus === 'ready' && reviews && reviews.total > 0 && (
                        <ul className='dishPageReviewList'>
                            {reviews.avaliacoes.map((a,idx)=>(
                                <li key={idx} className='dishPageReview'>
                                    <div className='dishPageReviewHead'>
                                        <span className='dishPageReviewStars'>{'★'.repeat(a.nota)}{'☆'.repeat(5-a.nota)}</span>
                                        <span className='dishPageReviewDate'>{formatDate(a.criado_em)}</span>
                                    </div>
                                    <p className='dishPageReviewAuthor'>{a.cliente || 'Cliente'}</p>
                                    {a.comentario && <p className='dishPageReviewText'>{a.comentario}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </main>
    )
}
