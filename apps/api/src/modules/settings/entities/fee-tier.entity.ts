import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsNumber, Min } from 'class-validator';

@Entity('fee_tiers')
export class FeeTier {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Column({ name: 'min_price', type: 'numeric', precision: 15, scale: 0 })
  minPrice!: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Column({ name: 'max_price', type: 'numeric', precision: 15, scale: 0, nullable: true })
  maxPrice!: number | null;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Column({ name: 'deposit_rate', type: 'decimal', precision: 5, scale: 4 })
  depositRate!: number;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
