const Supplier = require('../models/Supplier');
const apiResponse = require('../utils/apiResponse');

const normalizeSupplierPayload = (body = {}) => {
    const payload = { ...body };
    if (typeof payload.supplyCategories === 'string') {
        payload.supplyCategories = payload.supplyCategories
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (Array.isArray(payload.supplyCategories)) {
        payload.supplyCategories = payload.supplyCategories
            .map((item) => String(item).trim())
            .filter(Boolean);
    }
    if (payload.outstandingPayable !== undefined) {
        payload.outstandingPayable = Number(payload.outstandingPayable) || 0;
    }
    return payload;
};

exports.getAllSuppliers = async (req, res, next) => {
    try {
        const { page = 0, size = 10, search, status, sort } = req.query;
        const filter = { isDeleted: false };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;

        const skip = page * size;
        const suppliers = await Supplier.find(filter)
            .sort(sort ? sort.replace(',', ' ') : '-createdAt')
            .skip(skip)
            .limit(parseInt(size));

        const totalElements = await Supplier.countDocuments(filter);
        res.status(200).json(apiResponse.success({
            content: suppliers,
            totalElements,
            totalPages: Math.ceil(totalElements / size),
            size: parseInt(size),
            number: parseInt(page)
        }));
    } catch (err) { next(err); }
};

exports.getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json(apiResponse.error('Supplier not found'));
        const supplierObj = supplier.toObject();
        supplierObj.purchaseOrdersSummary = {
            count: 0,
            totalValue: 0,
            pendingCount: 0
        };
        res.status(200).json(apiResponse.success(supplierObj));
    } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create(normalizeSupplierPayload(req.body));
        res.status(201).json(apiResponse.success(supplier, 'Supplier created successfully'));
    } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, normalizeSupplierPayload(req.body), {
            new: true, runValidators: true
        });
        if (!supplier) return res.status(404).json(apiResponse.error('Supplier not found'));
        res.status(200).json(apiResponse.success(supplier, 'Supplier updated'));
    } catch (err) { next(err); }
};

exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, {
            isDeleted: true, deletedAt: new Date()
        }, { new: true });
        if (!supplier) return res.status(404).json(apiResponse.error('Supplier not found'));
        res.status(200).json(apiResponse.success(null, 'Supplier archived'));
    } catch (err) { next(err); }
};

exports.getSuppliersSummary = async (req, res, next) => {
    try {
        const [total, active, inactive] = await Promise.all([
            Supplier.countDocuments({ isDeleted: false }),
            Supplier.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
            Supplier.countDocuments({ isDeleted: false, status: 'INACTIVE' })
        ]);
        const payableResult = await Supplier.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, totalPayable: { $sum: '$outstandingPayable' } } }
        ]);
        res.status(200).json(apiResponse.success({
            total, active, inactive,
            totalPayable: payableResult[0]?.totalPayable || 0
        }));
    } catch (err) { next(err); }
};
