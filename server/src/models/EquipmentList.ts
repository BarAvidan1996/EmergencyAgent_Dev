import mongoose, { Document, Schema } from 'mongoose';

export interface IEquipmentItem {
  name: string;
  quantity: number;
  expiryDate?: Date;
  notes?: string;
}

export interface IEquipmentList extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  items: IEquipmentItem[];
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentItemSchema = new Schema<IEquipmentItem>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
});

const EquipmentListSchema = new Schema<IEquipmentList>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  items: [EquipmentItemSchema]
}, {
  timestamps: true
});

export const EquipmentList = mongoose.model<IEquipmentList>('EquipmentList', EquipmentListSchema); 