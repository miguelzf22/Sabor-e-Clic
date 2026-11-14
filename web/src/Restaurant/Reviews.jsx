import { useEffect, useState } from 'react'
import { StarIcon, StarHalfIcon } from '@phosphor-icons/react'
import { fetchRestaurantReviews, submitRestaurantReview } from '../authSession'
import { initials, colorFor } from '../utils/avatarColor'

// Reaproveita a mesma lógica de estrelas da página do restaurante (meio-estrela
// a partir de .5) para uma nota possivelmente fracionada.
function Stars({ value }) {
    return (
        <span className="reviewStars" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => {
                if (value >= star) return <StarIcon key={star} weight="fill" />
                if (value >= star - 0.5) return <StarHalfIcon key={star} weight="fill" />
                return <StarIcon key={star} weight="regular" />
            })}
        </span>
    )
}

function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Formulário de envio: reaproveita o layout do OrderCard (select de nota + textarea).
function ReviewForm({ restaurantId, initial, onSaved }) {
    const [nota, setNota] = useState(initial?.nota ?? 5)
    const [comentario, setComentario] = useState(initial?.comentario ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const enviar = async (e) => {
        e.preventDefault()
        if (saving) return
        setSaving(true); setError('')
        try {
            const saved = await submitRestaurantReview(restaurantId, { nota: Number(nota), comentario })
            onSaved(saved)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <form className="reviewForm" onSubmit={enviar}>
            <p className="reviewFormTitle">{initial ? 'Editar sua avaliação' : 'Avaliar este restaurante'}</p>
            <label>Nota:
                <select value={nota} onChange={(e) => setNota(e.target.value)}>
                    {[5, 4, 3, 2, 1].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
            </label>
            <label>Comentário (opcional):
                <textarea value={comentario} maxLength={500} rows={3} onChange={(e) => setComentario(e.target.value)} />
            </label>
            {error && <p role="alert" className="reviewFormError">{error}</p>}
            <button type="submit" disabled={saving}>{saving ? 'Enviando…' : 'Enviar avaliação'}</button>
        </form>
    )
}

export function RestaurantReviews({ slugOrId }) {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let active = true
        fetchRestaurantReviews(slugOrId)
            .then((d) => { if (active) { setData(d); setStatus('ready') } })
            .catch(() => { if (active) setStatus('error') })
        return () => { active = false }
    }, [slugOrId])

    const onSaved = () => {
        // Recarrega a lista para refletir a avaliação nova/editada e a média.
        fetchRestaurantReviews(slugOrId).then(setData).catch(() => {})
    }

    if (status === 'loading') return <p className="reviewsEmpty">Carregando avaliações…</p>
    if (status === 'error' || !data) return <p className="reviewsEmpty">Não foi possível carregar as avaliações.</p>

    const { media, total, pode_avaliar, minha_avaliacao, avaliacoes } = data

    return (
        <div className="reviews">
            <div className="reviewsSummary">
                {total > 0 ? (
                    <>
                        <Stars value={media} />
                        <span className="reviewsSummaryValue">{media.toFixed(1)}</span>
                        <span className="reviewsSummaryCount">
                            ({total} {total === 1 ? 'avaliação' : 'avaliações'})
                        </span>
                    </>
                ) : (
                    <span className="reviewsEmpty">Ainda não há avaliações deste restaurante.</span>
                )}
            </div>

            {pode_avaliar && (
                <ReviewForm restaurantId={data.id ?? slugOrId} initial={minha_avaliacao} onSaved={onSaved} />
            )}

            <ul className="reviewsList">
                {avaliacoes.map((a, i) => (
                    <li key={i} className="reviewItem">
                        <div
                            className="reviewAvatar"
                            style={a.avatar ? { backgroundImage: `url(${a.avatar})` } : { backgroundColor: colorFor(a.cliente) }}
                        >
                            {!a.avatar && <span>{initials(a.cliente)}</span>}
                        </div>
                        <div className="reviewBody">
                            <div className="reviewHead">
                                <span className="reviewName">{a.cliente}</span>
                                <span className="reviewDate">{formatDate(a.criado_em)}</span>
                            </div>
                            <Stars value={a.nota} />
                            {a.comentario && <p className="reviewComment">{a.comentario}</p>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
