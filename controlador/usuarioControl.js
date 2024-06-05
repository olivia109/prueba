'use strict';

const bcrypt = require('bcrypt');
var usuariosModelo = require('../modelo/usuarios');
const jwt = require('jsonwebtoken');
const usuario = new usuariosModelo();

function prueba(req, res) {
    res.status(200).send({
        message: 'Probando una acción del controlador de usuarios del API REST con Node y Mongo'
    });
}

async function registroUsuario(req, res) {

    var usuario = new usuariosModelo();

    var params = req.body;
    console.log(params);

    usuario.nombre = params.nombre;
    usuario.apellido = params.apellido;
    usuario.email = params.email;
    usuario.password = params.password;
    usuario.rol = 'ROLE_USER';
    usuario.imagen = 'null';

    if (!params.password) {
        return res.status(400).send({ message: 'Introduce la contraseña' });
    }

    try {
        const hash = await bcrypt.hash(params.password, 10);
        usuario.password = hash;

        if (!usuario.nombre || !usuario.apellido || !usuario.email) {
            return res.status(400).send({ message: 'Introduce todos los campos' });
        }

        const usuarioAlmacenado = await usuario.save();
        if (!usuarioAlmacenado) {
            return res.status(404).send({ message: 'No se ha registrado el usuario' });
        }

        res.status(200).send({ usuario: usuarioAlmacenado });
    } catch (err) {
        res.status(500).send({ message: 'Error al guardar el usuario' });
    }
}

async function accesoUsuario(req, res) {
    const { email, password, gethash } = req.body;

    try {
        const usuario = await usuariosModelo.findOne({ email: email });

        if (!usuario) {
            return res.status(404).send({ message: 'El usuario no existe' });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (passwordMatch) {
            console.log('Coincide el password');
            if (gethash) {
                const token = jwt.sign({ user: usuario }, 'tu_secreto', { expiresIn: '1h' });
                return res.status(200).send({ user: usuario, token: token });
            } else {
                return res.status(200).send({ user: usuario });
            }
        } else {
            return res.status(404).send({ message: 'El usuario no se ha identificado' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error en la petición' });
    }
}

module.exports = {
    prueba,
    registroUsuario,
    accesoUsuario
};