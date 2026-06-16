import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  AcceptPrivateSessionPage,
  AcknowledgeTipPage,
  AdminAdjustWalletPage,
  AdminApproveCreatorPage,
  AdminApproveMediaPage,
  AdminCreatorPage,
  AdminCreatorsPage,
  AdminCreateTagPage,
  AdminEditTagPage,
  AdminEndRoomPage,
  AdminForceEndPrivateSessionPage,
  AdminHideMediaPage,
  AdminHideRoomPage,
  AdminMediaPage,
  AdminOverviewPage,
  AdminPaymentPage,
  AdminPaymentsPage,
  AdminPrivateSessionsPage,
  AdminReportsPage,
  AdminRestoreUserPage,
  AdminReviewReportPage,
  AdminRoomPage,
  AdminRoomsPage,
  AdminSettingsPage,
  AdminSuspendCreatorPage,
  AdminTokenPacksPage,
  AdminCreateTokenPackPage,
  AdminEditTokenPackPage,
  AdminSuspendUserPage,
  AdminTagsPage,
  AdminTokenGrantsPage,
  AdminUserPage,
  AdminUsersPage,
  AdminWalletPage,
  ActivePrivateSessionPage,
  CaptureRoomThumbnailPage,
  CompleteTipPage,
  CreateCcbillCheckoutPage,
  CreateCreatorMenuItemPage,
  CreateReportPage,
  CreateTipPage,
  CreatorEarningsPage,
  CreatorRoomsPage,
  CreatorMenuItemsPage,
  CreatorProfilePage,
  DeclinePrivateSessionPage,
  EndPrivateSessionPage,
  EndRoomPage,
  GetLivekitTokenPage,
  GoLivePage,
  HandleCcbillWebhookPage,
  PaymentReturnPage,
  LoginPage,
  PrepareRoomPage,
  RegisterPage,
  RequestPrivateSessionPage,
  RoomMenuPage,
  RoomMessagesPage,
  RoomModerationPage,
  RoomPage,
  RoomsPage,
  StartPrivateSessionPage,
  TokenPacksPage,
  UpdateCreatorMenuItemPage,
  UpdateCreatorProfilePage,
  UploadMediaPage,
  WalletPage,
} from '@/pages'
import { AuthGuard } from '@/lib/AuthGuard'
import { Shell } from '@/components/layout/Shell'
import { AdminShell } from '@/components/layout/AdminShell'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / auth routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<Shell />}>
          <Route index element={<Navigate to="/rooms" replace />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/c/:categories" element={<RoomsPage />} />
          <Route path="/rooms/country/:countries" element={<RoomsPage />} />
          <Route path="/rooms/t/:tags" element={<RoomsPage />} />
          <Route path="/rooms/c/:categories/country/:countries" element={<RoomsPage />} />
          <Route path="/rooms/c/:categories/t/:tags" element={<RoomsPage />} />
          <Route path="/rooms/country/:countries/t/:tags" element={<RoomsPage />} />
          <Route path="/rooms/c/:categories/country/:countries/t/:tags" element={<RoomsPage />} />
          <Route path="/rooms/:slug" element={<RoomPage />} />
          <Route path="/creator/rooms/prepare" element={<PrepareRoomPage />} />
          <Route path="/creator/rooms/:roomId/go-live" element={<GoLivePage />} />
          <Route path="/creator/rooms/:roomId/end" element={<EndRoomPage />} />
          <Route path="/creator/profile" element={<CreatorProfilePage />} />
          <Route path="/creator/profile/edit" element={<UpdateCreatorProfilePage />} />
          <Route path="/creator/menu-items" element={<CreatorMenuItemsPage />} />
          <Route path="/creator/menu-items/new" element={<CreateCreatorMenuItemPage />} />
          <Route path="/creator/menu-items/:menuItemId" element={<UpdateCreatorMenuItemPage />} />
          <Route path="/livekit/token" element={<GetLivekitTokenPage />} />
          <Route path="/rooms/:roomId/messages" element={<RoomMessagesPage />} />
          <Route path="/creator/rooms/:roomId/moderation" element={<RoomModerationPage />} />
          <Route path="/rooms/:roomId/menu" element={<RoomMenuPage />} />
          <Route path="/rooms/:roomId/tips" element={<CreateTipPage />} />
          <Route path="/creator/tips/:tipId/acknowledge" element={<AcknowledgeTipPage />} />
          <Route path="/creator/tips/:tipId/complete" element={<CompleteTipPage />} />
          <Route path="/token-packs" element={<TokenPacksPage />} />
          <Route path="/payments/ccbill/checkout" element={<CreateCcbillCheckoutPage />} />
          <Route path="/payments/return" element={<PaymentReturnPage />} />
          <Route path="/webhooks/ccbill" element={<HandleCcbillWebhookPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/rooms/:roomId/private-sessions/request" element={<RequestPrivateSessionPage />} />
          <Route path="/creator/private-sessions/:sessionId/accept" element={<AcceptPrivateSessionPage />} />
          <Route path="/creator/private-sessions/:sessionId/decline" element={<DeclinePrivateSessionPage />} />
          <Route path="/private-sessions/:sessionId/start" element={<StartPrivateSessionPage />} />
          <Route path="/private-sessions/:sessionId/end" element={<EndPrivateSessionPage />} />
          <Route path="/private-sessions/:sessionId/active" element={<ActivePrivateSessionPage />} />
          <Route path="/media/upload" element={<UploadMediaPage />} />
          <Route path="/rooms/:roomId/thumbnail/capture" element={<CaptureRoomThumbnailPage />} />
          <Route path="/creator/earnings" element={<CreatorEarningsPage />} />
          <Route path="/creator/rooms" element={<CreatorRoomsPage />} />
          <Route path="/reports" element={<CreateReportPage />} />
          </Route>
        </Route>

        {/* Admin routes — own shell with sidebar nav + admin guard */}
        <Route element={<AuthGuard />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin/overview" element={<AdminOverviewPage />} />
            <Route path="/admin/rooms" element={<AdminRoomsPage />} />
            <Route path="/admin/rooms/:roomId" element={<AdminRoomPage />} />
            <Route path="/admin/rooms/:roomId/end" element={<AdminEndRoomPage />} />
            <Route path="/admin/rooms/:roomId/hide" element={<AdminHideRoomPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:userId" element={<AdminUserPage />} />
            <Route path="/admin/users/:userId/suspend" element={<AdminSuspendUserPage />} />
            <Route path="/admin/users/:userId/restore" element={<AdminRestoreUserPage />} />
            <Route path="/admin/creators" element={<AdminCreatorsPage />} />
            <Route path="/admin/creators/:creatorId" element={<AdminCreatorPage />} />
            <Route path="/admin/creators/:creatorId/approve" element={<AdminApproveCreatorPage />} />
            <Route path="/admin/creators/:creatorId/suspend" element={<AdminSuspendCreatorPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/payments/:paymentId" element={<AdminPaymentPage />} />
            <Route path="/admin/wallets/:userId" element={<AdminWalletPage />} />
            <Route path="/admin/wallets/:userId/adjust" element={<AdminAdjustWalletPage />} />
            <Route path="/admin/private-sessions" element={<AdminPrivateSessionsPage />} />
            <Route path="/admin/private-sessions/:sessionId/force-end" element={<AdminForceEndPrivateSessionPage />} />
            <Route path="/admin/media" element={<AdminMediaPage />} />
            <Route path="/admin/media/:mediaId/approve" element={<AdminApproveMediaPage />} />
            <Route path="/admin/media/:mediaId/hide" element={<AdminHideMediaPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/reports/:reportId/review" element={<AdminReviewReportPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/tags" element={<AdminTagsPage />} />
            <Route path="/admin/tags/new" element={<AdminCreateTagPage />} />
            <Route path="/admin/tags/:tagId/edit" element={<AdminEditTagPage />} />
            <Route path="/admin/token-grants" element={<AdminTokenGrantsPage />} />
            <Route path="/admin/token-packs" element={<AdminTokenPacksPage />} />
            <Route path="/admin/token-packs/new" element={<AdminCreateTokenPackPage />} />
            <Route path="/admin/token-packs/:packId/edit" element={<AdminEditTokenPackPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
