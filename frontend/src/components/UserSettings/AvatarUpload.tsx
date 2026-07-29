import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"

import { UsersService } from "@/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { getAvatarUrl, getInitials, handleError } from "@/utils"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const AvatarUpload = () => {
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()
  const { user: currentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      UsersService.uploadAvatar({ formData: { file } }),
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => UsersService.deleteAvatar(),
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (file.size > MAX_AVATAR_BYTES) {
      showErrorToast("Image must be 5MB or smaller")
      return
    }

    uploadMutation.mutate(file)
  }

  const isPending = uploadMutation.isPending || deleteMutation.isPending

  return (
    <div className="flex items-center gap-4 mb-6">
      <Avatar className="size-16">
        <AvatarImage src={getAvatarUrl(currentUser?.avatar_url)} alt="Avatar" />
        <AvatarFallback className="bg-zinc-600 text-white text-lg">
          {getInitials(currentUser?.full_name || currentUser?.email || "User")}
        </AvatarFallback>
      </Avatar>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? "Uploading..." : "Change avatar"}
        </Button>
        {currentUser?.avatar_url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? "Removing..." : "Remove"}
          </Button>
        )}
      </div>
    </div>
  )
}

export default AvatarUpload
