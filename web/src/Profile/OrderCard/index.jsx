import { NavLink } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import './OrderCard.css'

const STATUS_LABELS={ preparando:'Preparando', pronto:'Pronto', pago:'Pago', aguardando:'Aguardando pagamento', entregue:'Entregue', negado:'Cancelado' }

const ITEM_LABELS={ aguardando:'Aguardando confirmação', confirmado:'Confirmado', preparando:'Em preparo', pronto:'Pronto', entregue:'Entregue', negado:'Recusado' }

function formatDate(iso){
    if(!iso) return ''
    const [y,m,d]=iso.split('-')
    return d && m && y ? `${d}/${m}/${y}` : iso
}

function OrderItem({item}){
    return(
        <li>
            <div className='orderCardItemTop'>
                <span>{`${item.quantidade} × ${item.nome}`}</span>
                {item.restaurante_slug
                    ? <NavLink to={`/restaurante/${item.restaurante_slug}`} className='orderCardItemRestaurant'>{item.restaurante}</NavLink>
                    : <span className='orderCardItemRestaurant'>{item.restaurante}</span>}
                <span className={`orderCardItemStatus orderCardItemStatus--${item.status}`}>{ITEM_LABELS[item.status] || item.status}</span>
            </div>
            {item.status==='negado' && item.motivo_negacao && (
                <p className='orderCardDenied'>{`Recusado pela cozinha: ${item.motivo_negacao}`}</p>
            )}
        </li>
    )
}

export const OrderCard=({order})=>{
    const label=STATUS_LABELS[order.status] || order.status
    const entregue=order.status==='entregue'

    return(
        <div className='orderCard flex flex-col gap-4 sm:flex-row'>
            {/*Placeholder da imagem do restaurante*/}
            <div className='orderCardIcon'></div>
            <div className='orderCardInfo'>
                <p className='orderCardName'>{`Pedido #${order.id}`}</p>
                <p className='orderCardDate'>{formatDate(order.data)}</p>
                <p className='orderCardLabel'>Detalhes do pedido:</p>
                <ul className='orderCardItems'>
                    {order.itens.map((item)=>(
                        <OrderItem key={item.id_prato} item={item}/>
                    ))}
                </ul>
            </div>
            <div className='orderCardSide items-start sm:items-end'>
                <span className={`orderCardStatus ${entregue ? 'delivered' : ''}`}>{label}</span>
                <p className='orderCardTotal'>{formatCurrency(Number(order.total))}</p>
            </div>
        </div>
    )
}
