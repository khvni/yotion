import { Router } from 'express';
import * as blocksController from '../controllers/blocksController.js';
const router = Router();
router.get('/', blocksController.getBlocks);
router.post('/', blocksController.createBlock);
router.put('/reorder', blocksController.reorderBlocks);
router.put('/:id', blocksController.updateBlock);
router.delete('/:id', blocksController.deleteBlock);
export default router;
