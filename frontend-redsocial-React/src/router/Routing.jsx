import React from 'react'
import { Routes, Route, BrowserRouter, Navigate, Link } from 'react-router-dom';
import PublicLayout from '../componentes/layout/public/PublicLayout';
import Login from '../componentes/user/Login';
import Register from '../componentes/user/Register';
import PrivateLayout from '../componentes/layout/private/PrivateLayout';
import Feed from '../componentes/publication/Feed';
import {AuthProvider} from '../context/AuthProvider';
import Logout from '../componentes/user/Logout';
import People from '../componentes/user/People';
import Config from '../componentes/user/Config';
import Following from '../componentes/follow/Following';
import Followers from '../componentes/follow/Followers';
import Profile from '../componentes/user/Profile';


const Routing = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Login />} />
            <Route path='login' element={<Login />} />
            <Route path='registro' element={<Register />} />
          </Route>

          <Route path='/social' element={<PrivateLayout />}>
            <Route index element={<Feed />} />
            <Route path='feed' element={<Feed />} />
            <Route path='logout' element={<Logout />} />
            <Route path='gente' element={<People />} />
            <Route path='ajustes' element={<Config />} />
            <Route path='siguiendo/:userId' element={<Following />} />
            <Route path='seguidores/:userId' element={<Followers />} />
            <Route path='perfil/:userId' element={<Profile />} />
          </Route>

          <Route path='*' element={
            <>
              <p>
                <h1>Error 404</h1>
                <Link to="/">Volver al inicio</Link>
              </p>
            </>
          } />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default Routing