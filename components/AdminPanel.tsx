import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminIcon, EditIcon, TrashIcon } from './Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialLaptops, initialMobiles, initialProducts } from '../data/initialData';
import { Laptop, Mobile, Product } from '../types';

type Item = Laptop | Mobile | Product;
type ItemType = 'laptops' | 'mobiles' | 'products';

const AdminPanel: React.FC = () => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');

    const [laptops, setLaptops] = useLocalStorage<Laptop[]>('laptops', initialLaptops);
    const [mobiles, setMobiles] = useLocalStorage<Mobile[]>('mobiles', initialMobiles);
    const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
    
    const [activeTab, setActiveTab] = useState<ItemType>('laptops');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [currentItemType, setCurrentItemType] = useState<ItemType>('laptops');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '6947') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect password. The cosmos denies your entry.');
        }
    };

    const handleOpenModal = (itemType: ItemType, item: Item | null = null) => {
        setCurrentItemType(itemType);
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };
    
    const handleDelete = (itemType: ItemType, id: string) => {
        if (window.confirm('Are you sure you want to banish this item from the universe?')) {
            switch (itemType) {
                case 'laptops':
                    setLaptops(laptops.filter(item => item.id !== id));
                    break;
                case 'mobiles':
                    setMobiles(mobiles.filter(item => item.id !== id));
                    break;
                case 'products':
                    setProducts(products.filter(item => item.id !== id));
                    break;
            }
        }
    };
    
    const handleSave = (item: Item) => {
        const itemType = currentItemType;
        const setters = { laptops: setLaptops, mobiles: setMobiles, products: setProducts };
        const collections = { laptops, mobiles, products };
        
        const setCollection = setters[itemType];
        const collection = collections[itemType];

        if (editingItem) { // Update
            setCollection(collection.map(i => i.id === item.id ? item : i));
        } else { // Create
            setCollection([...collection, { ...item, id: `${itemType}-${Date.now()}` }]);
        }
        
        handleCloseModal();
    };

    const renderTable = (items: Item[], itemType: ItemType) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Price</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                            <td className="px-6 py-4 font-medium whitespace-nowrap">{item.name}</td>
                            <td className="px-6 py-4">${item.price}</td>
                            <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => handleOpenModal(itemType, item)} className="p-1.5 hover:bg-blue-500/20 rounded-md"><EditIcon className="w-4 h-4 text-blue-400"/></button>
                                <button onClick={() => handleDelete(itemType, item.id)} className="p-1.5 hover:bg-red-500/20 rounded-md"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    if (!isAuthenticated) {
        return (
            <motion.div 
                className="w-full max-w-sm flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
                <form onSubmit={handleLogin} className="w-full">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter the cosmic key..."
                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button type="submit" className="w-full mt-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors">Enter</button>
                    {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                </form>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="w-full md:max-w-6xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <AdminIcon />
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                </div>
                 <button onClick={() => handleOpenModal(activeTab)} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-500 transition-colors text-sm">
                    Add New {activeTab.slice(0, -1)}
                </button>
            </div>
            
            <div className="border-b border-gray-700 mb-4">
                <nav className="flex space-x-4">
                    {(['laptops', 'mobiles', 'products'] as ItemType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-grow">
                {activeTab === 'laptops' && renderTable(laptops, 'laptops')}
                {activeTab === 'mobiles' && renderTable(mobiles, 'mobiles')}
                {activeTab === 'products' && renderTable(products, 'products')}
            </div>
            
            <AnimatePresence>
                {isModalOpen && <ItemModal item={editingItem} itemType={currentItemType} onSave={handleSave} onClose={handleCloseModal} />}
            </AnimatePresence>
        </motion.div>
    );
};

const ItemModal: React.FC<{ item: Item | null, itemType: ItemType, onSave: (item: Item) => void, onClose: () => void }> = ({ item, itemType, onSave, onClose }) => {
    const [formData, setFormData] = useState<any>(
        item || (itemType === 'laptops' ? { specs: {} } : itemType === 'mobiles' ? { specs: {} } : {})
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, specs: { ...prev.specs, [name]: value } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Item);
    };

    const renderFields = () => {
        const commonFields = (
             <>
                <Input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Product Name" />
                <Input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="Price" />
                <Input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="Image URL" />
            </>
        );

        switch (itemType) {
            case 'laptops':
                return <>
                    {commonFields}
                    <h3 className="text-gray-400 text-sm mt-2">Specifications</h3>
                    <Input name="cpu" value={formData.specs?.cpu || ''} onChange={handleSpecChange} placeholder="CPU" />
                    <Input name="gpu" value={formData.specs?.gpu || ''} onChange={handleSpecChange} placeholder="GPU" />
                    <Input name="ram" value={formData.specs?.ram || ''} onChange={handleSpecChange} placeholder="RAM" />
                    <Input name="storage" value={formData.specs?.storage || ''} onChange={handleSpecChange} placeholder="Storage" />
                    <Input name="display" value={formData.specs?.display || ''} onChange={handleSpecChange} placeholder="Display" />
                </>;
            case 'mobiles':
                 return <>
                    {commonFields}
                    <h3 className="text-gray-400 text-sm mt-2">Specifications</h3>
                    <Input name="cpu" value={formData.specs?.cpu || ''} onChange={handleSpecChange} placeholder="CPU" />
                    <Input name="ram" value={formData.specs?.ram || ''} onChange={handleSpecChange} placeholder="RAM" />
                    <Input name="storage" value={formData.specs?.storage || ''} onChange={handleSpecChange} placeholder="Storage" />
                    <Input name="display" value={formData.specs?.display || ''} onChange={handleSpecChange} placeholder="Display" />
                    <Input name="camera" value={formData.specs?.camera || ''} onChange={handleSpecChange} placeholder="Camera" />
                </>;
            case 'products':
                return <>
                    {commonFields}
                    <Input name="description" value={formData.description || ''} onChange={handleChange} placeholder="Description" />
                    <label className="block text-sm font-medium text-gray-400">Category</label>
                    <select name="category" value={formData.category || 'T-Shirts'} onChange={handleChange} className="w-full bg-gray-900/80 border border-white/10 rounded-lg p-2.5 text-white focus:ring-purple-500 focus:border-purple-500">
                        <option>T-Shirts</option>
                        <option>Hoodies</option>
                        <option>Accessories</option>
                    </select>
                </>;
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-lg bg-gray-800 rounded-2xl border border-white/10 shadow-2xl p-6"
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">{item ? 'Edit' : 'Create'} {itemType.slice(0, -1)}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {renderFields()}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500">Save</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 capitalize">{props.name}</label>
        <input {...props} className="w-full bg-gray-900/80 border border-white/10 rounded-lg p-2.5 text-white focus:ring-purple-500 focus:border-purple-500" />
    </div>
);


export default AdminPanel;