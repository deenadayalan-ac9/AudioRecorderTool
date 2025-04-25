import { AudioRecorder } from "@/components/audio-recorder";
import { AudioTest } from "@/components/audio-test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden gradient-bg">
      <Tabs defaultValue="recorder" className="w-full max-w-md mx-auto pt-10">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recorder">Audio Recorder</TabsTrigger>
          <TabsTrigger value="test">API Test</TabsTrigger>
        </TabsList>
        <TabsContent value="recorder">
          <AudioRecorder />
        </TabsContent>
        <TabsContent value="test" className="mt-4">
          <AudioTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
