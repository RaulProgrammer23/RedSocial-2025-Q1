import React from 'react'
import Nav from './Nav'
import reloj from '../../../assets/img/miReloj.png'

const Header = () => {
    return (

        <header className="layout__navbar">

            <div className="navbar__header">
                {/*<a href="#" className="navbar__title">Red Social REACT</a>*/}
                {<img src={reloj} className="container-avatar__img" alt="Foto de perfil" width="60px"/>}
            </div>

            <Nav />


        </header>

    )
}

export default Header
