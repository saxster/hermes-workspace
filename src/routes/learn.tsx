import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { LearnScreen } from '@/screens/learn/learn-screen'

export const Route = createFileRoute('/learn')({
  ssr: false,
  component: LearnRoute,
})

function LearnRoute() {
  usePageTitle('Learn')
  return <LearnScreen />
}
