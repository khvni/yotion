import { Router } from 'express';
import * as documentsController from '../controllers/documentsController.js';
const router = Router();
router.get('/', documentsController.getDocuments);
router.post('/', documentsController.createDocument);
router.put('/reorder', documentsController.reorderDocuments);
router.put('/:id', documentsController.updateDocument);
router.delete('/:id', documentsController.deleteDocument);
export default router;
