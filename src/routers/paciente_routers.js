import {Router} from 'express'
import { confirmEmail, login, registro} from '../controllers/paciente_controller.js'


const router = Router()

//Rutas Públicas
router.post('/registro',registro)

router.get('/confirmar/:token',confirmEmail)

router.post('/login',login)



export default router