
// Mock Zoom Service to simulate API integration

export interface ZoomMeetingResponse {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
}

export const zoomService = {
  /**
   * Simulates creating a Zoom meeting via API
   */
  createMeeting: async (topic: string, startTime: Date, duration: number): Promise<ZoomMeetingResponse> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const meetingId = Math.floor(Math.random() * 9000000000) + 1000000000;
    const pwd = Math.random().toString(36).slice(-8);

    // In a real app, these would be actual Zoom API return values
    return {
      meetingId: meetingId.toString(),
      joinUrl: `https://zoom.us/w/${meetingId}?tk=student_token_mock`,
      startUrl: `https://zoom.us/s/${meetingId}?zpk=host_token_mock`,
      password: pwd
    };
  }
};
