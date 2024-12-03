import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40, nullable: false })
  name: string;

  @Column({type: 'varchar', length: 255, nullable: false, unique: true})
  email: string;

  @Column({type: 'varchar', length: 72, nullable: false})
  passwordHash: string

  @Column({type: 'bigint', nullable: false})
  createdAt: number; // unix timestamp in millisecond.

  @Column({type: 'bigint', nullable: false})
  updatedAt: number; // unix timestamp in millisecond.

  @Column({type: 'boolean', default: false})
  isDeleted: boolean;
}
