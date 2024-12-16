import { sendMailToUser, sendMailToRecoveryPassword } from "../config/nodemailer.js";
import { generarJWT } from "../helpers/crearJWT.js";
import Paciente from "../models/Paciente.js";
import mongoose from "mongoose";

const registro = async (req, res) => {
    // Paso 1 tomar datos del request
    const { email, password } = req.body;

    // Paso 2 Validar datos
    if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos debe llenar todos los campos" });

    const verificarEmailBDD = await Paciente.findOne({ email });
    if (verificarEmailBDD) return res.status(400).json({ msg: "Lo sentimos el email ya se encuentra registrado" });

    // Paso 3 - Interactuar con BDD
    const nuevoPaciente = new Paciente(req.body);
    nuevoPaciente.password = await nuevoPaciente.encrypPassword(password);
    const token = nuevoPaciente.crearToken();
    await sendMailToUser(email, token);
    await nuevoPaciente.save();
    res.status(200).json({ msg: "Revisa tu correo electrónico" });
}

const confirmEmail = async (req, res) => {
    // Paso 1 tomar datos del request
    const { token } = req.params;

    // Paso 2 Validar datos
    if (!(token)) return res.status(400).json({ msg: "Lo sentimos no se puede validar la cuenta" });

    const pacienteBDD = await Paciente.findOne({ token });
    if (!pacienteBDD?.token) return res.status(400).json({ msg: "La cuenta ya ha sido confirmada" });

    // Paso 3 - Interactuar con BDD
    pacienteBDD.token = null;
    pacienteBDD.confirmEmail = true;
    await pacienteBDD.save();
    res.status(200).json({ msg: "Token confirmado, ya puedes iniciar sesión" });
}

const login = async (req, res) => {
    // Paso 1: Tomar los datos del request (correo electrónico y contraseña)
    const { email, password } = req.body;

    // Paso 2: Validar datos
    if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos debes llenar todos los campos" });

    const pacienteBDD = await Paciente.findOne({ email }).select("-status -__v -updatedAt -createdAt");
    if (pacienteBDD?.confirmEmail === false) return res.status(400).json({ msg: "Lo sentimos debes validar tu cuenta" });

    if (!pacienteBDD) return res.status(400).json({ msg: "Lo sentimos el email no se encuentra registrado" });

    const verificarPassword = await pacienteBDD.matchPassword(password);
    if (!verificarPassword) return res.status(400).json({ msg: "Lo sentimos el password no es el correcto" });

    // Paso 3: Interactuar con BDD
    const tokenJWT = generarJWT(pacienteBDD._id, "paciente");

    res.status(200).json({ pacienteBDD, tokenJWT });
}

const recuperarPassword = async (req, res) => {
    // Paso 1: Tomar los datos del request (correo electrónico y contraseña)
    const { email } = req.body;

    // Paso 2: Validar datos
    if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Lo sentimos debes llenar todos los campos" });

    const pacienteBDD = await Paciente.findOne({ email });
    if (!pacienteBDD) return res.status(400).json({ msg: "Lo sentimos el email no se encuentra registrado" });

    // Paso 3: Interactuar con BDD
    const token = pacienteBDD.crearToken();
    pacienteBDD.token = token;
    sendMailToRecoveryPassword(email, token);
    await pacienteBDD.save();
    res.status(200).json({ msg: "Revisa tu correo para restablecer tu cuenta" });
}


export {
    registro,
    confirmEmail,
    login,
    recuperarPassword,
      
 
}
