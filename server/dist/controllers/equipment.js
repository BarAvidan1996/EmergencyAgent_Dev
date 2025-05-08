"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiryDates = exports.exportToCsv = exports.deleteList = exports.updateList = exports.getList = exports.getLists = exports.createList = void 0;
const EquipmentList_1 = require("../models/EquipmentList");
const twilio_1 = require("twilio");
const twilio = new twilio_1.Twilio(process.env.TWILIO_ACCOUNT_SID || '', process.env.TWILIO_AUTH_TOKEN || '');
const createList = async (req, res) => {
    var _a;
    try {
        const { title, items } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const list = new EquipmentList_1.EquipmentList({
            userId,
            title,
            items
        });
        await list.save();
        res.status(201).json(list);
    }
    catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({ message: 'Error creating list' });
    }
};
exports.createList = createList;
const getLists = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const lists = await EquipmentList_1.EquipmentList.find({ userId }).sort({ updatedAt: -1 });
        res.json(lists);
    }
    catch (error) {
        console.error('Get lists error:', error);
        res.status(500).json({ message: 'Error fetching lists' });
    }
};
exports.getLists = getLists;
const getList = async (req, res) => {
    var _a;
    try {
        const { listId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const list = await EquipmentList_1.EquipmentList.findOne({ _id: listId, userId });
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        res.json(list);
    }
    catch (error) {
        console.error('Get list error:', error);
        res.status(500).json({ message: 'Error fetching list' });
    }
};
exports.getList = getList;
const updateList = async (req, res) => {
    var _a;
    try {
        const { listId } = req.params;
        const { title, items } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const list = await EquipmentList_1.EquipmentList.findOne({ _id: listId, userId });
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        list.title = title;
        list.items = items;
        await list.save();
        res.json(list);
    }
    catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({ message: 'Error updating list' });
    }
};
exports.updateList = updateList;
const deleteList = async (req, res) => {
    var _a;
    try {
        const { listId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const list = await EquipmentList_1.EquipmentList.findOneAndDelete({ _id: listId, userId });
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        res.json({ message: 'List deleted successfully' });
    }
    catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({ message: 'Error deleting list' });
    }
};
exports.deleteList = deleteList;
const exportToCsv = async (req, res) => {
    var _a;
    try {
        const { listId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const list = await EquipmentList_1.EquipmentList.findOne({ _id: listId, userId });
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        // Create CSV content
        const headers = 'Name,Quantity,Expiry Date,Notes\n';
        const rows = list.items.map(item => {
            const expiryDate = item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '';
            return `${item.name},${item.quantity},${expiryDate},${item.notes || ''}`;
        }).join('\n');
        const csv = headers + rows;
        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${list.title.replace(/\s+/g, '_')}.csv`);
        res.send(csv);
    }
    catch (error) {
        console.error('Export to CSV error:', error);
        res.status(500).json({ message: 'Error exporting list to CSV' });
    }
};
exports.exportToCsv = exportToCsv;
const checkExpiryDates = async () => {
    try {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const lists = await EquipmentList_1.EquipmentList.find({
            'items.expiryDate': {
                $gte: new Date(),
                $lte: oneWeekFromNow
            }
        }).populate('userId', 'phoneNumber');
        for (const list of lists) {
            const expiringItems = list.items.filter(item => {
                if (!item.expiryDate)
                    return false;
                const expiryDate = new Date(item.expiryDate);
                return expiryDate >= new Date() && expiryDate <= oneWeekFromNow;
            });
            if (expiringItems.length > 0 && list.userId.phoneNumber) {
                const message = `Alert: The following items in your emergency kit "${list.title}" will expire soon:\n` +
                    expiringItems.map(item => `- ${item.name} (Expires: ${new Date(item.expiryDate).toLocaleDateString()})`).join('\n');
                await twilio.messages.create({
                    body: message,
                    to: list.userId.phoneNumber,
                    from: process.env.TWILIO_PHONE_NUMBER
                });
            }
        }
    }
    catch (error) {
        console.error('Check expiry dates error:', error);
    }
};
exports.checkExpiryDates = checkExpiryDates;
