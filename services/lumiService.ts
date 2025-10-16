export type Context = 'home' | 'video-call' | 'chat' | 'profile' | 'admin' | 'onboarding'

class LumiService {
  private context: Context = 'home'

  setContext(context: Context) {
    this.context = context
    console.log('[LumiService] Context set to:', context)
  }

  async getIcebreaker(): Promise<string> {
    const icebreakers = [
      'Ask about their favorite hobby!',
      'Share something interesting about your day',
      "Ask where they're from",
      'Talk about your favorite music or movies',
      "Ask about their weekend plans",
    ]
    return icebreakers[Math.floor(Math.random() * icebreakers.length)]
  }

  async getSuggestion(topic: string): Promise<string> {
    const suggestions: Record<string, string[]> = {
      conversation: ['Try asking open-ended questions', 'Share your interests', 'Be genuine and friendly'],
      profile: ['Add more photos to your profile', 'Write an interesting bio', 'Verify your account'],
      safety: ['Never share personal information', 'Report suspicious behavior', 'Use the block feature if needed'],
    }
    const topicSuggestions = suggestions[topic] ?? suggestions.conversation
    return topicSuggestions[Math.floor(Math.random() * topicSuggestions.length)]
  }

  async analyzeContentModeration(params: { contentType: 'report' | 'message' | 'profile'; reportsCount: number; reasons: string[]; contentAge: number; userHistory: string }): Promise<string> {
    console.log('[LumiService] analyzeContentModeration', { ctx: this.context, ...params })
    const severity = params.reportsCount >= 3 || params.reasons.some((r) => /abuse|harass|scam|nudity/i.test(r)) ? 'High' : 'Medium'
    const age = params.contentAge <= 1 ? 'recent' : `${params.contentAge}h old`
    return `Context: ${this.context}. Severity: ${severity}. Reasons: ${params.reasons.join(', ') || 'none'}. Content is ${age}. Recommendation: ${severity === 'High' ? 'Escalate to ban or warn' : 'Manual review and warn if repeated.'}`
  }

  async analyzeVerificationDocuments(_payload?: unknown): Promise<'pass' | 'fail' | 'manual-review'> {
    console.log('[LumiService] analyzeVerificationDocuments', { ctx: this.context, hasPayload: Boolean(_payload) })
    const outcomes = ['pass', 'fail', 'manual-review'] as const
    return outcomes[Math.floor(Math.random() * outcomes.length)]
  }

  async getOnboardingWelcome(name?: string): Promise<string> {
    const greetings = [
      'Welcome to Lumi! Ready to meet new people?',
      'Great to see you! Let’s set up your profile.',
      'You’re in! Start your first quick match now.',
    ]
    const base = greetings[Math.floor(Math.random() * greetings.length)]
    return name ? `${base} ${name}!` : base
  }
}

export const lumiService = new LumiService()
