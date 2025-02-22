import React from 'react'
import Header from './Header'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import useAuth from '../../../hooks/useAuth'

const PrivateLayout = () => {

  const {auth, loading} = useAuth();

  if(loading){
    return <h1>Cargando...</h1>
  }else{
    

  return (
    <>
        {/*LAYOUT*/}


        {/*Contenido principal*/}
        <Header />

        {/*Contenido principal*/}
        <section className="layout__content">
            {auth._id ?
              <Outlet />
              :
              <Navigate to="/login" />
            }
        </section>

        {/* Barra lateral*/}
        <Sidebar />
    </>
  );
  }
}

export default PrivateLayout
