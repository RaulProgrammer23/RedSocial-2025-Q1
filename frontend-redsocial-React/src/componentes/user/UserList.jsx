import React from 'react';
import avatar from '../../assets/img/user.png';
import { Global } from '../../helpers/Global';
import useAuth from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const UserList = ({ users, getUsers, following, setFollowing, page, setPage, more, loading }) => {
  const { auth } = useAuth();

  const nextPage = () => {
    if (!loading && more) {
      const next = page + 1;
      setPage(next);
      getUsers(next);
    }
  };

  const follow = async (userId) => {
    try {
      const request = await fetch(Global.url + 'follow/save', {
        method: 'POST',
        body: JSON.stringify({ followed: userId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token'),
        },
      });

      const data = await request.json();

      if (data.status === 'success') {
        setFollowing([...following, userId]);
      }
    } catch (error) {
      console.error('Error al seguir usuario:', error);
    }
  };

  const unfollow = async (userId) => {
    try {
      const request = await fetch(Global.url + 'follow/unfollow/' + userId, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token'),
        },
      });

      const data = await request.json();

      if (data.status === 'success') {
        const updatedFollowing = following.filter(followingUserId => userId !== followingUserId);
        setFollowing(updatedFollowing);
      }
    } catch (error) {
      console.error('Error al dejar de seguir usuario:', error);
    }
  };

  return (
    <>
      <div className="content__posts">
        {users.length === 0 && !loading && <p>No hay usuarios que mostrar</p>}
        {users.map(user => (
          <article className="posts__post" key={user._id}>
            <div className="post__container">
              <div className="post__image-user">
                <Link to={`/social/perfil/${user._id}`} className="post__image-link">
                  {user.image !== 'default.png' ? (
                    <img
                      src={Global.url + 'user/avatar/' + user.image}
                      className="post__user-image"
                      alt="Foto de perfil"
                    />
                  ) : (
                    <img src={avatar} className="post__user-image" alt="Foto de perfil" />
                  )}
                </Link>
              </div>

              <div className="post__body">
                <div className="post__user-info">
                  <Link to={`/social/perfil/${user._id}`} className="user-info__name">
                    {user.name} {user.surname}
                  </Link>
                  <span className="user-info__divider"> | </span>
                  <Link to={`/social/perfil/${user._id}`} className="user-info__create-date">
                    {user.created_at}
                  </Link>
                </div>
                <h4 className="post__content">{user.bio}</h4>
              </div>
            </div>

            {user._id !== auth._id && (
              <div className="post__buttons">
                {!following.includes(user._id) && (
                  <button
                    className="post__button post__button--green"
                    onClick={() => follow(user._id)}
                  >
                    Seguir
                  </button>
                )}
                {following.includes(user._id) && (
                  <button className="post__button" onClick={() => unfollow(user._id)}>
                    Dejar de seguir
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {loading && <div>Cargando...</div>}

      {more && !loading && (
        <div className="content__container-btn">
          <button className="content__btn-more-post" onClick={nextPage}>
            Ver más personas
          </button>
        </div>
      )}
    </>
  );
};

export default UserList;
