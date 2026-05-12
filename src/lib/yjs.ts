import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export const doc = new Y.Doc()

// In a real app, we might use a room name based on the user session
export const provider = typeof window !== 'undefined' 
  ? new WebrtcProvider('axiom-sovereign-orbital-mechanics', doc)
  : null

export const sharedState = doc.getMap('state')
