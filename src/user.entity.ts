import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: false })
  registrado_sebrae: boolean;

  @Column({ unique: true, length: 11 })
  document: string;

  setDocument(document: string) {
    const saltRounds = 10;
    this.document = bcrypt.hashSync(document, saltRounds);
  }

  checkDocument(document: string) {
    return bcrypt.compareSync(document, this.document);
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
