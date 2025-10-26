import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  Network,
  Tags,
  Target,
  Activity,
  Lightbulb,
} from "lucide-react";
import { AnalyticsData } from "../utils/analytics";

interface AnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: AnalyticsData;
  insights: string[];
}

const TYPE_COLORS: Record<string, string> = {
  Frontend: "#3b82f6",
  Backend: "#22c55e",
  Requirement: "#f97316",
  Documentation: "#a855f7",
  Other: "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#94a3b8",
  "In Progress": "#3b82f6",
  Completed: "#22c55e",
};

export function AnalyticsModal({
  open,
  onOpenChange,
  analytics,
  insights,
}: AnalyticsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Project Analytics
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Nodes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Network className="w-4 h-4 text-indigo-600" />
                    Total Nodes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{analytics.totalNodes}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Active project nodes
                  </p>
                </CardContent>
              </Card>

              {/* Completion Rate */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">
                    {analytics.completionStats.completionRate.toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.completionStats.completedTodos} of{" "}
                    {analytics.completionStats.totalTodos} tasks done
                  </p>
                </CardContent>
              </Card>

              {/* Connections */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Network className="w-4 h-4 text-blue-600" />
                    Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">
                    {analytics.connectivityStats.totalConnections}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.connectivityStats.averageConnectionsPerNode.toFixed(
                      1
                    )}{" "}
                    avg per node
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <CardDescription>Node creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nodesCreated"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 4 }}
                      name="Nodes Created"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Most Connected Node */}
            {analytics.connectivityStats.mostConnectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Most Connected Node
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    {analytics.connectivityStats.mostConnectedNode}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This node has the most connections in your project
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completion Tab */}
          <TabsContent value="completion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Progress</CardTitle>
                <CardDescription>
                  Track your task completion across all nodes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Task Completion</span>
                    <span className="text-sm">
                      {analytics.completionStats.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={analytics.completionStats.completionRate}
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl text-green-700">
                      {analytics.completionStats.completedTodos}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Tasks Completed
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl text-gray-700">
                      {analytics.completionStats.totalTodos -
                        analytics.completionStats.completedTodos}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Tasks Remaining
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Node Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown by completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.nodesByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) =>
                        count > 0 ? `${status}: ${count}` : ""
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.nodesByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {analytics.nodesByStatus.map((item) => (
                    <Badge
                      key={item.status}
                      variant="outline"
                      className="gap-2"
                      style={{
                        borderColor: STATUS_COLORS[item.status],
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: STATUS_COLORS[item.status],
                        }}
                      />
                      {item.status}: {item.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            {/* Node Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Node Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of nodes by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.nodesByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="type"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {analytics.nodesByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={TYPE_COLORS[entry.type] || "#94a3b8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {analytics.nodesByType.map((item) => (
                    <div
                      key={item.type}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: TYPE_COLORS[item.type],
                          }}
                        />
                        <span className="text-sm">{item.type}</span>
                      </div>
                      <div className="text-xl">{item.count}</div>
                      <div className="text-xs text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tag Distribution */}
            {analytics.tagDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tags className="w-4 h-4 text-orange-600" />
                    Popular Tags
                  </CardTitle>
                  <CardDescription>Most frequently used tags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analytics.tagDistribution.map((tag) => (
                      <Badge
                        key={tag.tag}
                        variant="secondary"
                        className="gap-1.5 px-3 py-1"
                      >
                        <span>{tag.tag}</span>
                        <span className="text-xs text-gray-500">
                          ({tag.count})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Smart recommendations based on your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
                    >
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No insights available yet. Add more nodes to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Project Size</span>
                  <Badge variant="secondary">{analytics.totalNodes} nodes</Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <Badge variant="secondary">
                    {analytics.completionStats.totalTodos} tasks
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Unique Tags</span>
                  <Badge variant="secondary">
                    {analytics.tagDistribution.length} tags
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Node Connections</span>
                  <Badge variant="secondary">
                    {analytics.connectivityStats.totalConnections} edges
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
