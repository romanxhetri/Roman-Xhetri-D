import { Laptop, Mobile, Product } from '../types';

export const initialLaptops: Laptop[] = [
  {
    id: 'cosmicbook-pro',
    name: 'CosmicBook Pro 16"',
    price: 2499,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1024',
    specs: {
      cpu: 'Quantum Core i9',
      gpu: 'Nova RTX 5080',
      ram: '32GB DDR5',
      storage: '2TB NVMe SSD',
      display: '16" Liquid Nebula XDR',
    }
  },
  {
    id: 'starlight-air',
    name: 'Starlight Air 13"',
    price: 1299,
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=1024',
    specs: {
      cpu: 'Stellar Fusion M4',
      gpu: 'Integrated 12-Core',
      ram: '16GB Unified',
      storage: '1TB SSD',
      display: '13.6" PixelDust Display',
    }
  },
  {
    id: 'nebula-gamer-9',
    name: 'Nebula Gamer 9',
    price: 3199,
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=1024',
    specs: {
      cpu: 'AMD Ryzen 9 9950X',
      gpu: 'NVIDIA RTX 5090',
      ram: '64GB DDR5',
      storage: '4TB RAID 0 SSD',
      display: '17" QHD 360Hz Mini-LED',
    }
  },
];

export const initialMobiles: Mobile[] = [
  {
    id: 'pixelverse-9-pro',
    name: 'Pixelverse 9 Pro',
    price: 1099,
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbf1?q=80&w=1024',
    specs: {
      cpu: 'Tensor G5 Chip',
      ram: '12GB LPDDR5X',
      storage: '256GB UFS 4.0',
      display: '6.7" Super Actua OLED',
      camera: '50MP Octa-PD Pro',
    }
  },
  {
    id: 'quantum-z-fold',
    name: 'Quantum Z Fold',
    price: 1799,
    imageUrl: 'https://images.unsplash.com/photo-1610945415242-a81d879a83d5?q=80&w=1024',
    specs: {
      cpu: 'Snapdragon 9 Gen 4',
      ram: '16GB LPDDR5X',
      storage: '512GB UFS 4.0',
      display: '7.8" Dynamic AMOLED 3X',
      camera: '108MP Pro-Grade',
    }
  },
  {
    id: 'aetherphone-lite',
    name: 'AetherPhone Lite',
    price: 499,
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-65845214a0a2?q=80&w=1024',
    specs: {
      cpu: 'Helio G99 Ultimate',
      ram: '8GB LPDDR4X',
      storage: '128GB UFS 2.2',
      display: '6.5" FHD+ 120Hz',
      camera: '64MP AI Triple Cam',
    }
  },
];

export const initialProducts: Product[] = [
    {
        id: 'product-1',
        name: 'Galaxy Nebula Hoodie',
        price: 79,
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6d5f9650d?q=80&w=1024',
        category: 'Hoodies',
        description: 'A cozy hoodie featuring a vibrant all-over galaxy print.'
    },
    {
        id: 'product-2',
        name: 'SageX Logo T-Shirt',
        price: 29,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1024',
        category: 'T-Shirts',
        description: 'Classic black t-shirt with the iconic SageX geometric logo.'
    },
    {
        id: 'product-3',
        name: 'Circuit Board Beanie',
        price: 24,
        imageUrl: 'https://images.unsplash.com/photo-1576871335622-86ae4b46ea63?q=80&w=1024',
        category: 'Accessories',
        description: 'A stylish beanie with a subtle, glowing circuit board pattern.'
    },
     {
        id: 'product-4',
        name: 'Quantum Entanglement Tee',
        price: 32,
        imageUrl: 'https://images.unsplash.com/photo-1633966902237-71644788339f?q=80&w=1024',
        category: 'T-Shirts',
        description: 'A mind-bending design that changes with your perspective.'
    }
];
