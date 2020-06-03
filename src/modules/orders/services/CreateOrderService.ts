import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkCustomerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkCustomerExists) {
      throw new AppError(`Customer doesn't exists.`);
    }

    const checkProductsExists = await this.productsRepository.findAllById(
      products,
    );

    const orderProducts = products.map(product => {
      const productExists = checkProductsExists.find(
        checkProduct => checkProduct.id === product.id,
      );

      if (!productExists) {
        throw new AppError(`One or more products doesn't exists.`);
      }

      if (product.quantity > productExists.quantity) {
        throw new AppError(`Insuficient quantity of product ${product.id}`);
      }

      return {
        product_id: product.id,
        price: productExists.price,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer: checkCustomerExists,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
