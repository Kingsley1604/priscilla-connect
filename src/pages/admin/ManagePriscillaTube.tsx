import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, Trash2, Eye, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface VideoContent {
  id: string;
  title: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  subject: string;
  duration: string;
  views: number;
  status: "approved" | "pending" | "rejected";
  thumbnail: string;
}

const ManagePriscillaTube = () => {
  const [videos, setVideos] = useState<VideoContent[]>([
    {
      id: "1",
      title: "Introduction to Algebra",
      description: "Basic concepts of algebra for SS1 students",
      uploadedBy: "Mrs. Adebayo",
      uploadedAt: "2024-01-15",
      subject: "Mathematics",
      duration: "15:30",
      views: 45,
      status: "approved",
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "2",
      title: "Photosynthesis Process",
      description: "Understanding how plants make their own food",
      uploadedBy: "Mr. Johnson",
      uploadedAt: "2024-01-14",
      subject: "Biology",
      duration: "12:45",
      views: 32,
      status: "pending",
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: "3",
      title: "English Grammar Basics",
      description: "Parts of speech and sentence construction",
      uploadedBy: "Miss Okafor",
      uploadedAt: "2024-01-13",
      subject: "English",
      duration: "20:15",
      views: 67,
      status: "approved",
      thumbnail: "/api/placeholder/300/200"
    }
  ]);

  const handleDeleteVideo = (id: string) => {
    setVideos(videos.filter(video => video.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: "approved" | "rejected") => {
    setVideos(videos.map(video => 
      video.id === id ? { ...video, status: newStatus } : video
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const stats = {
    total: videos.length,
    approved: videos.filter(v => v.status === "approved").length,
    pending: videos.filter(v => v.status === "pending").length,
    rejected: videos.filter(v => v.status === "rejected").length
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <PlayCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manage Priscilla Tube</h1>
              <p className="text-white/90">Review and manage all uploaded content</p>
            </div>
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Videos</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <PlayCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Content List */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>All Video Content</CardTitle>
              <CardDescription>Review, approve, or delete uploaded videos</CardDescription>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <div className="text-center py-8">
                  <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No videos uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="shadow-soft">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          {/* Video Thumbnail */}
                          <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <PlayCircle className="h-12 w-12 text-muted-foreground" />
                          </div>

                          {/* Video Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold truncate">{video.title}</h3>
                              {getStatusBadge(video.status)}
                            </div>
                            
                            <p className="text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{video.uploadedBy}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{video.uploadedAt}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <PlayCircle className="h-4 w-4" />
                                <span>{video.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{video.views} views</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{video.subject}</Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {video.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(video.id, "approved")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusChange(video.id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Video</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{video.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteVideo(video.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ManagePriscillaTube;