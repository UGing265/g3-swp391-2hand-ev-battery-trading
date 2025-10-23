'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getAllFeeTiers,
  createFeeTier,
  updateFeeTier,
  deleteFeeTier,
  type FeeTier,
} from '@/lib/api/feeTiersApi';
import { getSingleRefundPolicy, type RefundPolicy } from '@/lib/api/refundPolicy';
import { getSinglePostLifecycle, type PostLifecycle } from '@/lib/api/postLifecycleApi';
import {
  FeeTierStatsCards,
  FeeTierTable,
  FeeTierDialog,
  FeeTierActions,
  RefundPolicyCard,
  PostLifecycleCard,
} from './_components';
import type { FeeTierFormData } from './_components/FeeTierDialog';

export default function AdminSettingsPage() {
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);
  const [refundPolicy, setRefundPolicy] = useState<RefundPolicy | null>(null);
  const [postLifecycle, setPostLifecycle] = useState<PostLifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<FeeTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [feeTiersData, refundData, lifecycleData] = await Promise.all([
        getAllFeeTiers(),
        getSingleRefundPolicy(),
        getSinglePostLifecycle(),
      ]);

      // Sort fee tiers by minPrice ascending
      const sortedFeeTiers = feeTiersData.sort(
        (a, b) => parseFloat(a.minPrice) - parseFloat(b.minPrice),
      );

      setFeeTiers(sortedFeeTiers);
      setRefundPolicy(refundData);
      setPostLifecycle(lifecycleData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingTier(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (tier: FeeTier) => {
    setEditingTier(tier);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
  };

  const handleSubmit = async (formData: FeeTierFormData) => {
    // Validation
    if (!formData.minPrice || !formData.depositRate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const minPrice = parseFloat(formData.minPrice);
    const maxPrice = formData.maxPrice ? parseFloat(formData.maxPrice) : null;
    const depositRate = parseFloat(formData.depositRate) / 100;

    if (isNaN(minPrice) || minPrice < 0) {
      toast.error('Giá tối thiểu không hợp lệ');
      return;
    }

    if (maxPrice !== null && (isNaN(maxPrice) || maxPrice <= minPrice)) {
      toast.error('Giá tối đa phải lớn hơn giá tối thiểu');
      return;
    }

    if (isNaN(depositRate) || depositRate < 0 || depositRate > 1) {
      toast.error('Tỷ lệ đặt cọc phải từ 0 đến 100%');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        minPrice,
        maxPrice: maxPrice ?? 0,
        depositRate,
        active: formData.active,
      };

      if (editingTier) {
        await updateFeeTier(editingTier.id, payload);
        toast.success('Cập nhật hoa hồng thành công');
      } else {
        await createFeeTier(payload);
        toast.success('Tạo hoa hồng thành công');
      }

      await fetchAllData();
      handleCloseDialog();
    } catch (err: unknown) {
      console.error('Error saving fee tier:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể lưu hoa hồng';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTierId) return;

    try {
      await deleteFeeTier(deletingTierId);
      toast.success('Xóa hoa hồng thành công');
      await fetchAllData();
      setDeletingTierId(null);
    } catch (err: unknown) {
      console.error('Error deleting fee tier:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa hoa hồng';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTier = (tierId: number) => {
    setDeletingTierId(tierId);
  };

  const handleCancelDelete = () => {
    setDeletingTierId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
          <p className="text-gray-600 mt-2">Quản lý cài đặt hệ thống và chính sách</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Đang tải cài đặt...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
        <p className="text-gray-600 mt-2">
          Quản lý hoa hồng, chính sách hoàn tiền và vòng đời bài đăng
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fee-tiers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fee-tiers">Hoa Hồng</TabsTrigger>
          <TabsTrigger value="refund-policy">Chính Sách Hoàn Tiền</TabsTrigger>
          <TabsTrigger value="listing-lifecycle">Vòng Đời Bài Đăng</TabsTrigger>
        </TabsList>

        {/* Fee Tiers Tab */}
        <TabsContent value="fee-tiers" className="space-y-4">
          <FeeTierStatsCards feeTiers={feeTiers} />
          <FeeTierTable
            feeTiers={feeTiers}
            onAddTier={handleOpenAddDialog}
            onEditTier={handleOpenEditDialog}
            onDeleteTier={handleDeleteTier}
          />
        </TabsContent>

        {/* Refund Policy Tab */}
        <TabsContent value="refund-policy" className="space-y-4">
          <RefundPolicyCard refundPolicy={refundPolicy} onUpdate={fetchAllData} />
        </TabsContent>

        {/* Listing Lifecycle Tab */}
        <TabsContent value="listing-lifecycle" className="space-y-4">
          <PostLifecycleCard postLifecycle={postLifecycle} onUpdate={fetchAllData} />
        </TabsContent>
      </Tabs>

      {/* Fee Tier Add/Edit Dialog */}
      <FeeTierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTier={editingTier}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Fee Tier Delete Confirmation */}
      <FeeTierActions
        deletingTierId={deletingTierId}
        onConfirmDelete={handleDelete}
        onCancelDelete={handleCancelDelete}
      />
    </div>
  );
}
