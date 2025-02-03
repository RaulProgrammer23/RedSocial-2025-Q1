// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const Follow = require("../models/follow");
const Publication = require("../models/publication");
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const validate = require("../helpers/validate");

// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    });
};

// Registro de usuarios
const register = async (req, res) => {
    let params = req.body;

    // Comprobar que me llegan bien (+ validación)
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar",
        });
    }

    // Validación avanzada
    try {
        validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Validación no superada",
        });
    }

    // Control usuarios duplicados
    try {
        const users = await User.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() }
            ]
        });

        if (users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        }

        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        // Crear objeto de usuario
        let user_to_save = new User(params);

        // Guardar usuario en la bbdd
        const userStored = await user_to_save.save();
        
        // Eliminar password y role
        userStored.toObject();
        delete userStored.password;
        delete userStored.role;

        // Devolver resultado
        return res.status(200).json({
            status: "success",
            message: "Usuario registrado correctamente",
            user: userStored
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Error en la consulta de usuarios" });
    }
};

// Login de usuarios
const login = async (req, res) => {
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    try {
        // Buscar en la bbdd si existe
        const user = await User.findOne({ email: params.email });

        if (!user) return res.status(404).send({ status: "error", message: "No existe el usuario" });

        // Comprobar su contraseña
        const pwd = bcrypt.compareSync(params.password, user.password);

        if (!pwd) {
            return res.status(400).send({
                status: "error",
                message: "No te has identificado correctamente"
            });
        }

        // Conseguir Token
        const token = jwt.createToken(user);

        // Devolver Datos del usuario
        return res.status(200).send({
            status: "success",
            message: "Te has identificado correctamente",
            user: {
                id: user._id,
                name: user.name,
                nick: user.nick
            },
            token
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en el login",
            error
        });
    }
};

// Obtener perfil de usuario
const profile = async (req, res) => {
    const id = req.params.id;

    try {
        const userProfile = await User.findById(id).select({ password: 0, role: 0 });

        if (!userProfile) {
            return res.status(404).send({
                status: "error",
                message: "El usuario no existe o hay un error"
            });
        }

        // Info de seguimiento
        const followInfo = await followService.followThisUser(req.user.id, id);

        return res.status(200).send({
            status: "success",
            user: userProfile,
            following: followInfo.following,
            follower: followInfo.follower
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener el perfil",
            error
        });
    }
};

// Listar usuarios
const list = async (req, res) => {
    let page = req.params.page ? parseInt(req.params.page) : 1;
    let itemsPerPage = 5;

    try {
        const users = await User.find().select("-password -email -role -__v").sort('_id').paginate(page, itemsPerPage);

        if (!users || users.length === 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles"
            });
        }

        const followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            users,
            page,
            itemsPerPage,
            total: users.length,
            pages: Math.ceil(users.length / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al listar usuarios",
            error
        });
    }
};

// Actualizar usuario
const update = async (req, res) => {
    const userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    try {
        const users = await User.find({
            $or: [
                { email: userToUpdate.email.toLowerCase() },
                { nick: userToUpdate.nick.toLowerCase() }
            ]
        });

        let userIsset = false;
        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true;
        });

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        }

        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        } else {
            delete userToUpdate.password;
        }

        const userUpdated = await User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true });

        if (!userUpdated) {
            return res.status(400).json({ status: "error", message: "Error al actualizar" });
        }

        return res.status(200).send({
            status: "success",
            message: "Método de actualizar usuario",
            user: userUpdated
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al actualizar",
            error
        });
    }
};

// Subir imagen de perfil
const upload = async (req, res) => {
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye la imagen"
        });
    }

    let image = req.file.originalname;
    const imageSplit = image.split(".");
    const extension = imageSplit[1];

    if (extension !== "png" && extension !== "jpg" && extension !== "jpeg" && extension !== "gif") {
        const filePath = req.file.path;
        fs.unlinkSync(filePath);

        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalida"
        });
    }

    try {
        const userUpdated = await User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true });

        if (!userUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar"
            });
        }

        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al actualizar la imagen de perfil",
            error
        });
    }
};

// Obtener avatar de usuario
const avatar = (req, res) => {
    const file = req.params.file;
    const filePath = "./uploads/avatars/" + file;

    fs.stat(filePath, (error, exists) => {
        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        return res.sendFile(path.resolve(filePath));
    });
};

// Obtener contadores de un usuario
const counters = async (req, res) => {
    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        const following = await Follow.countDocuments({ "user": userId });
        const followed = await Follow.countDocuments({ "followed": userId });
        const publications = await Publication.countDocuments({ "user": userId });

        return res.status(200).send({
            userId,
            following,
            followed,
            publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en los contadores",
            error
        });
    }
};

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
};
