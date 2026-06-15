import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RegisterPage } from '@/pages/RegisterPage'
import { LoginPage } from '@/pages/LoginPage'
import { RoomsPage } from '@/pages/RoomsPage'
import { RoomPage } from '@/pages/RoomPage'
import { PrepareRoomPage } from '@/pages/PrepareRoomPage'
import { GoLivePage } from '@/pages/GoLivePage'
import { EndRoomPage } from '@/pages/EndRoomPage'
import { CreatorProfilePage } from '@/pages/CreatorProfilePage'
import { UpdateCreatorProfilePage } from '@/pages/UpdateCreatorProfilePage'
import { CreatorMenuItemsPage } from '@/pages/CreatorMenuItemsPage'
import { CreateCreatorMenuItemPage } from '@/pages/CreateCreatorMenuItemPage'
import { UpdateCreatorMenuItemPage } from '@/pages/UpdateCreatorMenuItemPage'
import { GetLivekitTokenPage } from '@/pages/GetLivekitTokenPage'
import { RoomMessagesPage } from '@/pages/RoomMessagesPage'
import { RoomMenuPage } from '@/pages/RoomMenuPage'
import { CreateTipPage } from '@/pages/CreateTipPage'
import { AcknowledgeTipPage } from '@/pages/AcknowledgeTipPage'
import { CompleteTipPage } from '@/pages/CompleteTipPage'
import { TokenPacksPage } from '@/pages/TokenPacksPage'
import { CreateCcbillCheckoutPage } from '@/pages/CreateCcbillCheckoutPage'
import { HandleCcbillWebhookPage } from '@/pages/HandleCcbillWebhookPage'
import { WalletPage } from '@/pages/WalletPage'
import { RequestPrivateSessionPage } from '@/pages/RequestPrivateSessionPage'
import { AcceptPrivateSessionPage } from '@/pages/AcceptPrivateSessionPage'
import { DeclinePrivateSessionPage } from '@/pages/DeclinePrivateSessionPage'
import { StartPrivateSessionPage } from '@/pages/StartPrivateSessionPage'
import { EndPrivateSessionPage } from '@/pages/EndPrivateSessionPage'
import { UploadMediaPage } from '@/pages/UploadMediaPage'
import { CaptureRoomThumbnailPage } from '@/pages/CaptureRoomThumbnailPage'
import { CreatorEarningsPage } from '@/pages/CreatorEarningsPage'
import { CreateReportPage } from '@/pages/CreateReportPage'
import { AdminOverviewPage } from '@/pages/AdminOverviewPage'
import { AdminRoomsPage } from '@/pages/AdminRoomsPage'
import { AdminRoomPage } from '@/pages/AdminRoomPage'
import { AdminEndRoomPage } from '@/pages/AdminEndRoomPage'
import { AdminHideRoomPage } from '@/pages/AdminHideRoomPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { AdminUserPage } from '@/pages/AdminUserPage'
import { AdminSuspendUserPage } from '@/pages/AdminSuspendUserPage'
import { AdminRestoreUserPage } from '@/pages/AdminRestoreUserPage'
import { AdminCreatorsPage } from '@/pages/AdminCreatorsPage'
import { AdminApproveCreatorPage } from '@/pages/AdminApproveCreatorPage'
import { AdminSuspendCreatorPage } from '@/pages/AdminSuspendCreatorPage'
import { AdminPaymentsPage } from '@/pages/AdminPaymentsPage'
import { AdminPaymentPage } from '@/pages/AdminPaymentPage'
import { AdminWalletPage } from '@/pages/AdminWalletPage'
import { AdminAdjustWalletPage } from '@/pages/AdminAdjustWalletPage'
import { AdminPrivateSessionsPage } from '@/pages/AdminPrivateSessionsPage'
import { AdminForceEndPrivateSessionPage } from '@/pages/AdminForceEndPrivateSessionPage'
import { AdminMediaPage } from '@/pages/AdminMediaPage'
import { AdminApproveMediaPage } from '@/pages/AdminApproveMediaPage'
import { AdminHideMediaPage } from '@/pages/AdminHideMediaPage'
import { AdminReportsPage } from '@/pages/AdminReportsPage'
import { AdminReviewReportPage } from '@/pages/AdminReviewReportPage'
import { AuthGuard } from '@/lib/AuthGuard'
import { Shell } from '@/components/layout/Shell'

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
          <Route path="/rooms/:roomId/menu" element={<RoomMenuPage />} />
          <Route path="/rooms/:roomId/tips" element={<CreateTipPage />} />
          <Route path="/creator/tips/:tipId/acknowledge" element={<AcknowledgeTipPage />} />
          <Route path="/creator/tips/:tipId/complete" element={<CompleteTipPage />} />
          <Route path="/token-packs" element={<TokenPacksPage />} />
          <Route path="/payments/ccbill/checkout" element={<CreateCcbillCheckoutPage />} />
          <Route path="/webhooks/ccbill" element={<HandleCcbillWebhookPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/rooms/:roomId/private-sessions/request" element={<RequestPrivateSessionPage />} />
          <Route path="/creator/private-sessions/:sessionId/accept" element={<AcceptPrivateSessionPage />} />
          <Route path="/creator/private-sessions/:sessionId/decline" element={<DeclinePrivateSessionPage />} />
          <Route path="/private-sessions/:sessionId/start" element={<StartPrivateSessionPage />} />
          <Route path="/private-sessions/:sessionId/end" element={<EndPrivateSessionPage />} />
          <Route path="/media/upload" element={<UploadMediaPage />} />
          <Route path="/rooms/:roomId/thumbnail/capture" element={<CaptureRoomThumbnailPage />} />
          <Route path="/creator/earnings" element={<CreatorEarningsPage />} />
          <Route path="/reports" element={<CreateReportPage />} />
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
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
