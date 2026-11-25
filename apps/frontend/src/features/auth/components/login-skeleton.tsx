import { Skeleton } from "@/components/ui/skeleton"

export function LoginSkeleton() {
  return (
    <form className="flex flex-col h-full">
      <div className="flex flex-col gap-6 h-full">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40 ml-auto" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-auto pt-4">
          <Skeleton className="w-full h-11 rounded-full" />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </form>
  )
}
