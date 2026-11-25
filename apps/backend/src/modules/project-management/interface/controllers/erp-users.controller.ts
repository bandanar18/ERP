import { Request, Response } from 'express';
import { ErpUsersService } from '../../application/services/erp-users.service.js';

export class ErpUsersController {
  constructor(private readonly service: ErpUsersService) {
    // Bind methods to this instance
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.service.findAll();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await this.service.findById(id);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.service.create(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await this.service.update(id, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await this.service.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
