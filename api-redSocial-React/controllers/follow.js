// Importar modelo
const Follow = require("../models/follow");
const User = require("../models/user");

// Importar servicio
const followService = require("../services/followService");

// Importar dependencias
const mongoosePaginate = require("mongoose-pagination");

// Acciones de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js",
    });
};

// Acción de guardar un follow (acción seguir)
const save = async (req, res) => {
    try {
        // Conseguir datos por body
        const params = req.body;

        // Validar parámetros requeridos
        if (!params.followed) {
            return res.status(400).send({
                status: "error",
                message: "El campo 'followed' es obligatorio.",
            });
        }

        // Sacar id del usuario identificado
        const identity = req.user;

        // Crear objeto con modelo Follow
        const userToFollow = new Follow({
            user: identity.id,
            followed: params.followed,
        });

        // Guardar objeto en la base de datos
        const followStored = await userToFollow.save();

        return res.status(200).send({
            status: "success",
            identity: req.user,
            follow: followStored,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se ha podido seguir al usuario.",
        });
    }
};

// Acción de borrar un follow (acción dejar de seguir)
const unfollow = async (req, res) => {
    try {
        // Recoger el id del usuario identificado
        const userId = req.user.id;

        // Recoger el id del usuario que sigo y quiero dejar de seguir
        const followedId = req.params.id;

        // Find de las coincidencias y eliminar
        const followDeleted = await Follow.deleteOne({ user: userId, followed: followedId });

        if (!followDeleted.deletedCount) {
            return res.status(404).send({
                status: "error",
                message: "No se encontró el follow a eliminar.",
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente.",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se pudo eliminar el follow.",
        });
    }
};

// Acción listado de usuarios que cualquier usuario está siguiendo (siguiendo)
const following = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        let userId = req.user.id;

        // Comprobar si me llega el id por parámetro en la URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página, si no, la página 1
        let page = 1;
        if (req.params.page) page = req.params.page;

        // Usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Buscar usuarios que el usuario sigue y paginar
        const result = await Follow.find({ user: userId })
            .populate("user followed", "-password -role -__v -email")
            .paginate(page, itemsPerPage);

        // Obtener array de IDs de usuarios que sigo y que me siguen
        const followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo.",
            follows: result.docs || [], // Asegurarse de que "follows" sea un arreglo vacío si no hay resultados
            total: result.totalDocs,
            pages: result.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el listado de usuarios seguidos.",
        });
    }
};

// Acción listado de usuarios que siguen a cualquier otro usuario (soy seguido, mis seguidores)
const followers = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        let userId = req.user.id;

        // Comprobar si me llega el id por parámetro en la URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página, si no, la página 1
        let page = 1;
        if (req.params.page) page = req.params.page;

        // Usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Buscar usuarios que siguen al usuario actual y paginar
        const result = await Follow.find({ followed: userId })
            .populate("user", "-password -role -__v -email")
            .paginate(page, itemsPerPage);

        // Obtener array de IDs de usuarios que sigo y que me siguen
        const followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me siguen.",
            follows: result.docs || [], // Asegurarse de que "follows" sea un arreglo vacío si no hay resultados
            total: result.totalDocs,
            pages: result.totalPages,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el listado de seguidores.",
        });
    }
};

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers,
};
