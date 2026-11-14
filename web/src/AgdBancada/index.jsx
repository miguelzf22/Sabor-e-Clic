import { useEffect, useState } from 'react'
import { Header } from '../Components/Header'
import { CardBancada } from './CardBancada'
import { fetchMyBookings } from '../authSession'
import { useAuth } from '../authContext'
import './AgdBancada.css'

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
const STATUS_LABEL = { pendente: 'Aguardando a cozinha', aceito: 'Aceito', negado: 'Recusado' }

export const AgdBancada=()=>{
    const { user } = useAuth()
    const isCustomer = user?.role === 'customer'
    const [bancadas, setBancadas] = useState([])
    const [status, setStatus] = useState('loading')
    const [bookings, setBookings] = useState([])
    const [bookingsStatus, setBookingsStatus] = useState(isCustomer ? 'loading' : 'na') // loading | ready | error | na

    useEffect(() => {
        let active = true
        fetch('/api/bancadas', { credentials: 'include' })
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok) throw new Error(data.error?.message || 'Não foi possível carregar as bancadas.')
                return data.bancadas || []
            })
            .then((items) => { if (active) { setBancadas(items); setStatus('ready') } })
            .catch(() => { if (active) setStatus('error') })
        return () => { active = false }
    }, [])

    // Agendamentos do próprio cliente (todos os status: pendente/aceito/negado).
    useEffect(() => {
        if (!isCustomer) return
        let active = true
        fetchMyBookings()
            .then((list) => { if (active) { setBookings(list); setBookingsStatus('ready') } })
            .catch(() => { if (active) setBookingsStatus('error') })
        return () => { active = false }
    }, [isCustomer])

    return (
        <main id='conteudo-principal' className='agdBancadaPage'>
            <Header/>
            <div className='agdBancadaContent'>
                <p className='agdBancadaEyebrow'>Para donos de restaurante e microempreendedores</p>
                <h1 className='agdBancadaTitle'>Agende uma bancada</h1>
                <p className='agdBancadaSubtitle'>
                    Agende com a Sabor&amp;Click uma bancada com todos os itens necessários para tornar suas receitas ainda mais deliciosas.
                </p>

                {isCustomer && (
                    <section className='agdBancadaMine'>
                        <h2 className='agdBancadaSectionTitle'>Meus agendamentos</h2>
                        {bookingsStatus === 'loading' && <p role='status'>Carregando seus agendamentos…</p>}
                        {bookingsStatus === 'error' && <p role='alert'>Não foi possível carregar seus agendamentos.</p>}
                        {bookingsStatus === 'ready' && bookings.length === 0 && <p>Você ainda não solicitou nenhuma bancada.</p>}
                        {bookingsStatus === 'ready' && bookings.length > 0 && (
                            <ul className='agdBancadaBookings'>
                                {bookings.map((b) => (
                                    <li key={b.id} className='agdBancadaBooking'>
                                        <div className='agdBancadaBookingInfo'>
                                            <strong>{b.bancada}</strong>
                                            <span>{new Date(b.horario_agendado).toLocaleString('pt-BR')} · {b.tempo_agendado} min · {brl(b.preco_total)}</span>
                                            {b.status === 'negado' && b.motivo_negacao && (
                                                <span className='agdBancadaBookingReason'>Motivo: {b.motivo_negacao}</span>
                                            )}
                                        </div>
                                        <span className={`agdBancadaBadge agdBancadaBadge--${b.status}`}>
                                            {STATUS_LABEL[b.status] || b.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <h2 className='agdBancadaSectionTitle'>Horários e datas disponíveis</h2>

                {status === 'loading' && <p role='status'>Carregando bancadas…</p>}
                {status === 'error' && <p role='alert'>Não foi possível carregar as bancadas.</p>}
                {status === 'ready' && bancadas.length === 0 && <p>Nenhuma bancada disponível no momento.</p>}

                <div className='agdBancadaList'>
                    {status === 'ready' && bancadas.map((bancada) => <CardBancada key={bancada.id} bancada={bancada} />)}
                </div>
            </div>
        </main>
    )
}
