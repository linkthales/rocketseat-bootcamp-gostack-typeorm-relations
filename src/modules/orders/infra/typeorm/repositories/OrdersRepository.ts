import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private orderRepository: Repository<Order>;

  private orderProductsRepository: Repository<OrdersProducts>;

  constructor() {
    this.orderRepository = getRepository(Order);
    this.orderProductsRepository = getRepository(OrdersProducts);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.orderRepository.create({
      customer,
      order_products: products,
    });

    const { id: order_id } = await this.orderRepository.save(order);

    const productsWithOrderId = products.map(product => ({
      ...product,
      order_id,
    }));

    this.orderProductsRepository.create(productsWithOrderId);

    await this.orderProductsRepository.save(productsWithOrderId);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const findOrder = await this.orderRepository.findOne(id, {
      relations: ['customer', 'order_products'],
    });

    return findOrder;
  }
}

export default OrdersRepository;
