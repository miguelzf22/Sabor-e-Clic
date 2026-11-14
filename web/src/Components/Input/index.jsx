import { useId } from 'react'
import './Input.css'
export const Input=({label,placeholder,type,value,onChange,className,maxLength})=>{
    // Associa label<->input via id gerado (acessibilidade: leitores de tela e
    // clique no rótulo para focar o campo).
    const inputId=useId()
    return(
        <>
        <div className='loginInputField'>
        <label className='loginLabel transition-all duration-500 ease text-[24px] md:text-[28px]' htmlFor={inputId}>{label}</label>
        <input className={className}
            id={inputId}
            type={type}
            placeholder={placeholder}
            value = {value}
            onChange = {onChange}
            maxLength={maxLength}
        />
        </div>
        </>
    )
}
