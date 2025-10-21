'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Post, PostStatus } from '@/types/post';
import { getMyPosts, updatePost, deleteMyPostById } from '@/lib/api/postApi';
import { useAuth } from '@/lib/auth-context';
import SearchBar from './_components/search-bar';
import PostListItem from './_components/post-list-item';
import PostDetailDialog from './_components/post-detail-dialog';
import DeleteConfirmDialog from './_components/delete-confirm-dialog';
import RejectReasonDialog from './_components/reject-reason-dialog';
import VerificationRejectReasonDialog from './_components/verification-reject-reason-dialog';
import EmptyState from './_components/empty-state';
import PostListSkeleton from './_components/post-list-skeleton';

export default function MyPostsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, loading } = useAuth();

  // Redirect if not logged in - but wait for auth to initialize
  useEffect(() => {
    // Don't redirect if still loading auth state
    if (loading) {
      return;
    }

    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để xem tin đăng của bạn');
      router.push('/login');
    }
  }, [isLoggedIn, loading, router]);

  const [activeTab, setActiveTab] = useState<PostStatus>('PUBLISHED');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-asc' | 'price-desc'>('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [postToView, setPostToView] = useState<Post | null>(null);
  const [rejectReasonDialogOpen, setRejectReasonDialogOpen] = useState(false);
  const [postForRejectReason, setPostForRejectReason] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [verificationRejectReasonDialogOpen, setVerificationRejectReasonDialogOpen] = useState(false);
  const [postForVerificationRejectReason, setPostForVerificationRejectReason] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Query for each status to get posts and counts
  const draftQuery = useQuery({
    queryKey: ['myPosts', 'DRAFT'],
    queryFn: () => getMyPosts({ status: 'DRAFT', order: 'DESC', sort: 'createdAt' }),
    enabled: isLoggedIn,
    retry: 1,
  });

  const pendingQuery = useQuery({
    queryKey: ['myPosts', 'PENDING_REVIEW'],
    queryFn: () => getMyPosts({ status: 'PENDING_REVIEW', order: 'DESC', sort: 'createdAt' }),
    enabled: isLoggedIn,
    retry: 1,
  });

  const publishedQuery = useQuery({
    queryKey: ['myPosts', 'PUBLISHED'],
    queryFn: () => getMyPosts({ status: 'PUBLISHED', order: 'DESC', sort: 'createdAt' }),
    enabled: isLoggedIn,
    retry: 1,
  });

  const rejectedQuery = useQuery({
    queryKey: ['myPosts', 'REJECTED'],
    queryFn: () => getMyPosts({ status: 'REJECTED', order: 'DESC', sort: 'createdAt' }),
    enabled: isLoggedIn,
    retry: 1,
  });

  const soldQuery = useQuery({
    queryKey: ['myPosts', 'SOLD'],
    queryFn: () => getMyPosts({ status: 'SOLD', order: 'DESC', sort: 'createdAt' }),
    enabled: isLoggedIn,
    retry: 1,
  });

  // Get counts from array lengths
  const counts = {
    DRAFT: draftQuery.data?.length || 0,
    PENDING_REVIEW: pendingQuery.data?.length || 0,
    PUBLISHED: publishedQuery.data?.length || 0,
    REJECTED: rejectedQuery.data?.length || 0,
    SOLD: soldQuery.data?.length || 0,
  };

  // Get current posts based on active tab
  const getCurrentPosts = () => {
    switch (activeTab) {
      case 'DRAFT':
        return draftQuery.data || [];
      case 'PENDING_REVIEW':
        return pendingQuery.data || [];
      case 'PUBLISHED':
        return publishedQuery.data || [];
      case 'REJECTED':
        return rejectedQuery.data || [];
      case 'SOLD':
        return soldQuery.data || [];
      default:
        return [];
    }
  };

  const posts = getCurrentPosts();
  const isLoading =
    draftQuery.isLoading ||
    pendingQuery.isLoading ||
    publishedQuery.isLoading ||
    rejectedQuery.isLoading ||
    soldQuery.isLoading;

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deleteMyPostById(postId),
    onSuccess: () => {
      toast.success('Đã xóa tin đăng thành công');
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    },
    onError: () => {
      toast.error('Xóa tin đăng thất bại. Vui lòng thử lại.');
    },
  });

  const markAsSoldMutation = useMutation({
    mutationFn: (postId: string) => updatePost(postId, { status: 'SOLD' }),
    onSuccess: () => {
      toast.success('Đã đánh dấu bài đăng là đã bán');
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
    onError: () => {
      toast.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as PostStatus);
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  const handleDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (postToDelete) {
      deleteMutation.mutate(postToDelete);
    }
  };
  const handleViewDetail = (post: Post) => {
    setPostToView(post);
    setViewDialogOpen(true);
  };
  const handleMarkAsSold = (postId: string) => {
    markAsSoldMutation.mutate(postId);
  };
  const handleEdit = (postId: string) => {
    router.push(`/posts/${postId}/edit`);
  };
  const handleCreateNew = () => {
    router.push('/posts/create');
  };
  const handleViewRejectReason = (postId: string, postTitle: string) => {
    setPostForRejectReason({ id: postId, title: postTitle });
    setRejectReasonDialogOpen(true);
  };

  const handleViewVerificationRejectReason = (postId: string, postTitle: string) => {
    setPostForVerificationRejectReason({ id: postId, title: postTitle });
    setVerificationRejectReasonDialogOpen(true);
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background md:p-8">
        <div className="mx-auto max-w-6xl p-6 bg-white rounded-2xl shadow">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">Quản lý tin đăng</h1>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onCreateNew={handleCreateNew}
            />
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-auto grid-cols-5 mb-8 p-1 h-auto bg-background">
              <TabsTrigger
                value="PUBLISHED"
                className="gap-2 text-base font-semibold h-full data-[state=active]:bg-white"
              >
                ĐANG HIỂN THỊ
                {counts.PUBLISHED > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {counts.PUBLISHED}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="REJECTED"
                className="gap-2 text-base font-semibold h-full data-[state=active]:bg-white"
              >
                BỊ TỪ CHỐI
                {counts.REJECTED > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {counts.REJECTED}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="SOLD"
                className="gap-2 text-base font-semibold h-full data-[state=active]:bg-white"
              >
                ĐÃ BÁN
                {counts.SOLD > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {counts.SOLD}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="DRAFT"
                className="gap-2 text-base font-semibold h-full data-[state=active]:bg-white"
              >
                TIN NHÁP
                {counts.DRAFT > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {counts.DRAFT}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="PENDING_REVIEW"
                className="gap-2 text-base font-semibold h-full data-[state=active]:bg-white"
              >
                CHỜ DUYỆT
                {counts.PENDING_REVIEW > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {counts.PENDING_REVIEW}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            {(['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SOLD', 'DRAFT'] as PostStatus[]).map(
              (status) => (
                <TabsContent key={status} value={status} className="mt-0">
                  {isLoading ? (
                    <PostListSkeleton />
                  ) : posts.length === 0 ? (
                    <EmptyState status={status} onCreateNew={handleCreateNew} />
                  ) : (
                    <div className="space-y-0">
                      {posts.map((post, index) => (
                        <div key={post.id} className={index !== posts.length - 1 ? 'border-b' : ''}>
                          <PostListItem
                            post={post}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={handleViewDetail}
                            onMarkAsSold={handleMarkAsSold}
                            onViewRejectReason={handleViewRejectReason}
                            onViewVerificationRejectReason={handleViewVerificationRejectReason}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ),
            )}
          </Tabs>
        </div>
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
        />
        <PostDetailDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          post={postToView}
        />
        <RejectReasonDialog
          open={rejectReasonDialogOpen}
          onOpenChange={setRejectReasonDialogOpen}
          postId={postForRejectReason?.id || ''}
          postTitle={postForRejectReason?.title || ''}
        />
        <VerificationRejectReasonDialog
          open={verificationRejectReasonDialogOpen}
          onOpenChange={setVerificationRejectReasonDialogOpen}
          postId={postForVerificationRejectReason?.id || ''}
          postTitle={postForVerificationRejectReason?.title || ''}
        />
      </div>
    </TooltipProvider>
  );
}
