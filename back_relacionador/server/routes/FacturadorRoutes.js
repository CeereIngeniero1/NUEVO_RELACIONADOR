const {Request, TYPES} = require('tedious');
const Router = require('express').Router;
const {sql, poolPromise} = require('../db2');


const router = Router();

router.get('/Facturador/:DocumentoEmpresa', async (req , res) => {
    try {
        const DocumentoEmpresa = req.params.DocumentoEmpresa;
        const pool = await poolPromise;

        const result = await pool.request().input('DocumentoEmpresa', sql.VarChar,DocumentoEmpresa).query('Select fac.* From CredencialesWSDLFacturaTech crede left join facturador fac on fac.[Id Facturador] = crede.[Id Facturador] WHERE crede.[Documento Empresa] = @DocumentoEmpresa');

        res.json(result.recordset);

    } catch (error) {
        console.error('❌ Error al obtener datos del usuario HC:', error);
        res.status(500).send('Error interno del servidor');
    }
});


module.exports = router;