const mongoose = require("mongoose");

const connection = async() => {

    try{
        await mongoose.connect("mongodb://localhost:27017/api-redSocial-React");

        console.log("Conectado correctamente a bd: api-redSocial-React");


    } catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la BD");
    }

}

module.exports = connection
