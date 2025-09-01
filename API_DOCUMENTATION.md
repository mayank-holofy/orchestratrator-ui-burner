v0.1.0
OAS 3.1.0
LangGraph Platform

Download OpenAPI Document

Download OpenAPI Document
Server
Server:
https://orchestrator.some1.ai
Client Libraries
Shell Curl
Assistants ​Copy link
An assistant is a configured instance of a graph.

AssistantsOperations
post
/assistants
post
/assistants/search
post
/assistants/count
get
/assistants/{assistant_id}
delete
/assistants/{assistant_id}
patch
/assistants/{assistant_id}
get
/assistants/{assistant_id}/graph
get
/assistants/{assistant_id}/subgraphs
get
/assistants/{assistant_id}/subgraphs/{namespace}
get
/assistants/{assistant_id}/schemas
post
/assistants/{assistant_id}/versions
post
/assistants/{assistant_id}/latest
Create Assistant​Copy link
Create an assistant.

An initial version of the assistant will be created and the assistant is set to that version. To change versions, use the POST /assistants/{assistant_id}/latest endpoint.

Body
required
application/json
graph_idCopy link to graph_id
Type:Graph Id
enum
const:  
deepagent
required
The ID of the graph the assistant should use. The graph ID is normally set in your langgraph.json configuration.

deepagent
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
The ID of the assistant. If not provided, a random UUID will be generated.

configCopy link to config
Type:Config
Configuration to use for the graph. Useful when graph is configurable and you want to create different assistants based on different configurations.

contextCopy link to context
Type:Context
Static context added to the assistant.

descriptionCopy link to description
Type:Description
The description of the assistant. Defaults to null.

if_existsCopy link to if_exists
Type:If Exists
enum
default:  
"raise"
How to handle duplicate creation. Must be either 'raise' (raise error if duplicate), or 'do_nothing' (return existing assistant).

raise
do_nothing
metadataCopy link to metadata
Type:Metadata
Metadata to add to assistant.

nameCopy link to name
Type:Name
The name of the assistant. Defaults to 'Untitled'.

Responses

200
Success

application/json

404
Not Found

application/json

409
Conflict

application/json

422
Validation Error

application/json
Request Example forpost/assistants

Shell Curl

curl https://orchestrator.some1.ai/assistants \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "assistant_id": "",
  "graph_id": "deepagent",
  "config": {},
  "context": {},
  "metadata": {},
  "if_exists": "raise",
  "name": "",
  "description": null
}'

Test Request
(post /assistants)
Status:200
Status:404
Status:409
Status:422

{
  "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
  "graph_id": "deepagent",
  "config": {
    "tags": [
      "string"
    ],
    "recursion_limit": 1,
    "configurable": {}
  },
  "context": {},
  "created_at": "2025-09-01T08:53:09.560Z",
  "updated_at": "2025-09-01T08:53:09.560Z",
  "metadata": {},
  "version": 1,
  "name": "string",
  "description": null
}
Success

Search Assistants​Copy link
Search for assistants.

This endpoint also functions as the endpoint to list all assistants.

Body
required
application/json
graph_idCopy link to graph_id
Type:Graph Id
enum
const:  
deepagent
The ID of the graph to filter by. The graph ID is normally set in your langgraph.json configuration.

deepagent
limitCopy link to limit
Type:Limit
min:  
1
max:  
1000
default:  
10
The maximum number of results to return.

metadataCopy link to metadata
Type:Metadata
Metadata to filter by. Exact match filter for each KV pair.

offsetCopy link to offset
Type:Offset
min:  
0
default:  
0
The number of results to skip.

selectCopy link to select
Type:array Select[]
enum
Specify which fields to return. If not provided, all fields are returned.

assistant_id
graph_id
name
description
config
Show all values
sort_byCopy link to sort_by
Type:Sort By
enum
The field to sort by.

assistant_id
created_at
updated_at
name
graph_id
sort_orderCopy link to sort_order
Type:Sort Order
enum
The order to sort by.

asc
desc
Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forpost/assistants/search

Shell Curl

curl https://orchestrator.some1.ai/assistants/search \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "metadata": {},
  "graph_id": "deepagent",
  "limit": 10,
  "offset": 0,
  "sort_by": "assistant_id",
  "sort_order": "asc",
  "select": [
    "assistant_id"
  ]
}'

Test Request
(post /assistants/search)
Status:200
Status:404
Status:422

[
  {
    "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
    "graph_id": "deepagent",
    "config": {
      "tags": [
        "string"
      ],
      "recursion_limit": 1,
      "configurable": {}
    },
    "context": {},
    "created_at": "2025-09-01T08:53:09.560Z",
    "updated_at": "2025-09-01T08:53:09.560Z",
    "metadata": {},
    "version": 1,
    "name": "string",
    "description": null
  }
]
Success

Count Assistants​Copy link
Get the count of assistants matching the specified criteria.

Body
required
application/json
graph_idCopy link to graph_id
Type:Graph Id
The ID of the graph to filter by. The graph ID is normally set in your langgraph.json configuration.

metadataCopy link to metadata
Type:Metadata
Metadata to filter by. Exact match filter for each KV pair.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forpost/assistants/count

Shell Curl

curl https://orchestrator.some1.ai/assistants/count \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "metadata": {},
  "graph_id": ""
}'

Test Request
(post /assistants/count)
Status:200
Status:404
Status:422

1
Success

Get Assistant​Copy link
Get an assistant by ID.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant ID
Format:uuid
required
The ID of the assistant.

Responses

200
Success

application/json

404
Not Found

application/json
Request Example forget/assistants/{assistant_id}

Shell Curl

curl https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000

Test Request
(get /assistants/{assistant_id})
Status:200
Status:404

{
  "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
  "graph_id": "deepagent",
  "config": {
    "tags": [
      "string"
    ],
    "recursion_limit": 1,
    "configurable": {}
  },
  "context": {},
  "created_at": "2025-09-01T08:53:09.560Z",
  "updated_at": "2025-09-01T08:53:09.560Z",
  "metadata": {},
  "version": 1,
  "name": "string",
  "description": null
}
Success

Delete Assistant​Copy link
Delete an assistant by ID.

All versions of the assistant will be deleted as well.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant ID
Format:uuid
required
The ID of the assistant.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example fordelete/assistants/{assistant_id}

Shell Curl

curl https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000 \
  --request DELETE

Test Request
(delete /assistants/{assistant_id})
Status:200
Status:404
Status:422
null
Success

Patch Assistant​Copy link
Update an assistant.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant ID
Format:uuid
required
The ID of the assistant.

Body
required
application/json
configCopy link to config
Type:Config
Configuration to use for the graph. Useful when graph is configurable and you want to update the assistant's configuration.

contextCopy link to context
Type:Context
Static context added to the assistant.

descriptionCopy link to description
Type:Description
The new description for the assistant. If not provided, assistant will keep its current description.

graph_idCopy link to graph_id
Type:Graph Id
enum
const:  
deepagent
The ID of the graph the assistant should use. The graph ID is normally set in your langgraph.json configuration. If not provided, assistant will keep pointing to same graph.

deepagent
metadataCopy link to metadata
Type:Metadata
Metadata to merge with existing assistant metadata.

nameCopy link to name
Type:Name
The new name for the assistant. If not provided, assistant will keep its current name.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forpatch/assistants/{assistant_id}

Shell Curl

curl https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000 \
  --request PATCH \
  --header 'Content-Type: application/json' \
  --data '{
  "graph_id": "deepagent",
  "config": {},
  "context": {},
  "metadata": {},
  "name": "",
  "description": ""
}'

Test Request
(patch /assistants/{assistant_id})
Status:200
Status:404
Status:422

{
  "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
  "graph_id": "deepagent",
  "config": {
    "tags": [
      "string"
    ],
    "recursion_limit": 1,
    "configurable": {}
  },
  "context": {},
  "created_at": "2025-09-01T08:53:09.560Z",
  "updated_at": "2025-09-01T08:53:09.560Z",
  "metadata": {},
  "version": 1,
  "name": "string",
  "description": null
}
Success

Get Assistant Graph​Copy link
Get an assistant by ID.

Path Parameters
assistant_idCopy link to assistant_id
required
The ID of the assistant.


Any of
Assistant ID
Type:Assistant ID
Format:uuid
The ID of the assistant.

Query Parameters
xrayCopy link to xray
Include graph representation of subgraphs. If an integer value is provided, only subgraphs with a depth less than or equal to the value will be included.


One of
Xray
Type:Xray
default:  
false
Include graph representation of subgraphs. If an integer value is provided, only subgraphs with a depth less than or equal to the value will be included.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forget/assistants/{assistant_id}/graph

Shell Curl

curl 'https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/graph?xray=false'

Test Request
(get /assistants/{assistant_id}/graph)
Status:200
Status:404
Status:422

{
  "propertyName*": [
    {}
  ]
}
Success

Get Assistant Subgraphs​Copy link
Get an assistant's subgraphs.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

Query Parameters
recurseCopy link to recurse
Type:Recurse
default:  
false
Recursively retrieve subgraphs of subgraphs.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forget/assistants/{assistant_id}/subgraphs

Shell Curl

curl 'https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/subgraphs?recurse=false'

Test Request
(get /assistants/{assistant_id}/subgraphs)
Status:200
Status:404
Status:422

{
  "propertyName*": {
    "input_schema": {},
    "output_schema": {},
    "state_schema": {},
    "config_schema": {},
    "context_schema": {}
  }
}
Success

Get Assistant Subgraphs by Namespace​Copy link
Get an assistant's subgraphs filtered by namespace.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

namespaceCopy link to namespace
Type:Namespace
required
Namespace of the subgraph to filter by.

Query Parameters
recurseCopy link to recurse
Type:Recurse
default:  
false
Recursively retrieve subgraphs of subgraphs.

Responses

200
Success

application/json

422
Validation Error

application/json
Request Example forget/assistants/{assistant_id}/subgraphs/{namespace}

Shell Curl

curl 'https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/subgraphs/{namespace}?recurse=false'

Test Request
(get /assistants/{assistant_id}/subgraphs/{namespace})
Status:200
Status:422

{
  "propertyName*": {
    "input_schema": {},
    "output_schema": {},
    "state_schema": {},
    "config_schema": {},
    "context_schema": {}
  }
}
Success

Get Assistant Schemas​Copy link
Get an assistant by ID.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forget/assistants/{assistant_id}/schemas

Shell Curl

curl https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/schemas

Test Request
(get /assistants/{assistant_id}/schemas)
Status:200
Status:404
Status:422

{
  "graph_id": "deepagent",
  "input_schema": {},
  "output_schema": {},
  "state_schema": {},
  "config_schema": {},
  "context_schema": {}
}
Success

Get Assistant Versions​Copy link
Get all versions of an assistant.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

Responses

200
Success

application/json

422
Validation Error

application/json
Request Example forpost/assistants/{assistant_id}/versions

Shell Curl

curl https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/versions \
  --request POST

Test Request
(post /assistants/{assistant_id}/versions)
Status:200
Status:422

[
  {
    "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
    "graph_id": "deepagent",
    "config": {
      "tags": [
        "string"
      ],
      "recursion_limit": 1,
      "configurable": {}
    },
    "context": {},
    "created_at": "2025-09-01T08:53:09.560Z",
    "updated_at": "2025-09-01T08:53:09.560Z",
    "metadata": {},
    "version": 1,
    "name": "string",
    "description": null
  }
]
Success

Set Latest Assistant Version​Copy link
Set the latest version for an assistant.

Path Parameters
assistant_idCopy link to assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

Query Parameters
versionCopy link to version
Type:Version
required
The version to change to.

Responses

200
Success

application/json

404
Not Found

application/json

422
Validation Error

application/json
Request Example forpost/assistants/{assistant_id}/latest

Shell Curl

curl 'https://orchestrator.some1.ai/assistants/123e4567-e89b-12d3-a456-426614174000/latest?version=1' \
  --request POST

Test Request
(post /assistants/{assistant_id}/latest)
Status:200
Status:404
Status:422

{
  "assistant_id": "123e4567-e89b-12d3-a456-426614174000",
  "graph_id": "deepagent",
  "config": {
    "tags": [
      "string"
    ],
    "recursion_limit": 1,
    "configurable": {}
  },
  "context": {},
  "created_at": "2025-09-01T08:53:09.560Z",
  "updated_at": "2025-09-01T08:53:09.560Z",
  "metadata": {},
  "version": 1,
  "name": "string",
  "description": null
}
Success

Threads (Collapsed)​Copy link
A thread contains the accumulated outputs of a group of runs.

ThreadsOperations
post
/threads
post
/threads/search
post
/threads/count
get
/threads/{thread_id}/state
post
/threads/{thread_id}/state
get
/threads/{thread_id}/state/{checkpoint_id}
post
/threads/{thread_id}/state/checkpoint
get
/threads/{thread_id}/history
post
/threads/{thread_id}/history
post
/threads/{thread_id}/copy
get
/threads/{thread_id}
delete
/threads/{thread_id}
patch
/threads/{thread_id}
get
/threads/{thread_id}/stream
Show More
Thread Runs (Collapsed)​Copy link
A run is an invocation of a graph / assistant on a thread. It updates the state of the thread.

Thread RunsOperations
get
/threads/{thread_id}/runs
post
/threads/{thread_id}/runs
post
/threads/{thread_id}/runs/stream
post
/threads/{thread_id}/runs/wait
get
/threads/{thread_id}/runs/{run_id}
delete
/threads/{thread_id}/runs/{run_id}
get
/threads/{thread_id}/runs/{run_id}/join
get
/threads/{thread_id}/runs/{run_id}/stream
post
/threads/{thread_id}/runs/{run_id}/cancel
post
/runs/cancel
Show More
Stateless Runs (Collapsed)​Copy link
A run is an invocation of a graph / assistant, with no state or memory persistence.

Stateless RunsOperations
post
/runs/stream
post
/runs/wait
post
/runs
post
/runs/batch
Show More
Crons (Plus tier) (Collapsed)​Copy link
A cron is a periodic run that recurs on a given schedule. The repeats can be isolated, or share state in a thread

Crons (Plus tier)Operations
post
/threads/{thread_id}/runs/crons
post
/runs/crons
post
/runs/crons/search
post
/runs/crons/count
delete
/runs/crons/{cron_id}
Show More
Store (Collapsed)​Copy link
Store is an API for managing persistent key-value store (long-term memory) that is available from any thread.

StoreOperations
put
/store/items
delete
/store/items
get
/store/items
post
/store/items/search
post
/store/namespaces
Show More
MCP (Collapsed)​Copy link
Model Context Protocol related endpoints for exposing an agent as an MCP server.

MCPOperations
post
/mcp/
get
/mcp/
delete
/mcp/
Show More
System ​Copy link
System endpoints for health checks, metrics, and server information.

SystemOperations
get
/info
get
/metrics
get
/ok
Server Information​Copy link
Get server version information, feature flags, and metadata.

Responses

200
Success

application/json
Request Example forget/info

Shell Curl

curl https://orchestrator.some1.ai/info

Test Request
(get /info)
Status:200

{
  "version": "string",
  "langgraph_py_version": "string",
  "flags": {},
  "metadata": {}
}
Success

System Metrics​Copy link
Get system metrics in Prometheus or JSON format for monitoring and observability.

Query Parameters
formatCopy link to format
Type:Output Format
enum
default:  
"prometheus"
Response format: prometheus (default) or json

prometheus
json
Responses

200
Success

Selected Content Type:
application/json
Request Example forget/metrics

Shell Curl

curl 'https://orchestrator.some1.ai/metrics?format=prometheus'

Test Request
(get /metrics)
Status:200

{}
Success

Health Check​Copy link
Check the health status of the server. Optionally check database connectivity.

Query Parameters
check_dbCopy link to check_db
Type:Check Database
enum
default:  
0
Whether to check database connectivity (0=false, 1=true)

0
1
Responses

200
Success

application/json

500
Internal Server Error

application/json
Request Example forget/ok

Shell Curl

curl 'https://orchestrator.some1.ai/ok?check_db=0'

Test Request
(get /ok)
Status:200
Status:500

{
  "ok": true
}
Success

Models

Assistant​Copy link
assistant_id
Type:Assistant Id
Format:uuid
required
The ID of the assistant.

config
Type:Config
required
The assistant config.


Config
created_at
Type:Created At
Format:date-time
required
The time the assistant was created.

graph_id
Type:Graph Id
enum
const:  
deepagent
required
The ID of the graph.

deepagent
metadata
Type:Metadata
required
The assistant metadata.

updated_at
Type:Updated At
Format:date-time
required
The last time the assistant was updated.

context
Type:Context
Static context added to the assistant.

description
Type:string | null
The description of the assistant

name
Type:Assistant Name
The name of the assistant

version
Type:Version
The version of the assistant


AssistantCreate​Copy link
Payload for creating an assistant.

graph_id
Type:Graph Id
enum
const:  
deepagent
required
The ID of the graph the assistant should use. The graph ID is normally set in your langgraph.json configuration.

deepagent
assistant_id
Type:Assistant Id
Format:uuid
The ID of the assistant. If not provided, a random UUID will be generated.

config
Type:Config
Configuration to use for the graph. Useful when graph is configurable and you want to create different assistants based on different configurations.

context
Type:Context
Static context added to the assistant.

description
Type:string | null
The description of the assistant. Defaults to null.

if_exists
Type:If Exists
enum
default:  
"raise"
How to handle duplicate creation. Must be either 'raise' (raise error if duplicate), or 'do_nothing' (return existing assistant).

raise
do_nothing
metadata
Type:Metadata
Metadata to add to assistant.

name
Type:Name
The name of the assistant. Defaults to 'Untitled'.


AssistantPatch​Copy link
Payload for updating an assistant.

config
Type:Config
Configuration to use for the graph. Useful when graph is configurable and you want to update the assistant's configuration.

context
Type:Context
Static context added to the assistant.

description
Type:Description
The new description for the assistant. If not provided, assistant will keep its current description.

graph_id
Type:Graph Id
enum
const:  
deepagent
The ID of the graph the assistant should use. The graph ID is normally set in your langgraph.json configuration. If not provided, assistant will keep pointing to same graph.

deepagent
metadata
Type:Metadata
Metadata to merge with existing assistant metadata.

name
Type:Name
The new name for the assistant. If not provided, assistant will keep its current name.


AssistantVersionChange​Copy link
Payload for changing the version of an assistant.

version
Type:Version
The assistant version.


Config​Copy link
configurable
Type:Configurable
recursion_limit
Type:Recursion Limit
Integer numbers.

tags
Type:array string[]

Cron​Copy link
Represents a scheduled task.

created_at
Type:Created At
Format:date-time
required
The time the cron was created.

cron_id
Type:Cron Id
Format:uuid
required
The ID of the cron.

end_time
Type:End Time
Format:date-time
required
The end date to stop running the cron.

payload
Type:Payload
required
The run payload to use for creating new run.

schedule
Type:Schedule
required
The schedule to run, cron format.

thread_id
Type:Thread Id
Format:uuid
required
The ID of the thread.

updated_at
Type:Updated At
Format:date-time
required
The last time the cron was updated.

assistant_id
Type:string | null
Format:uuid
The ID of the assistant.

metadata
Type:Metadata
The cron metadata.

next_run_date
Type:string | null
Format:date-time
The next run date of the cron.

user_id
Type:string | null
The ID of the user.


CronCreate​Copy link
Payload for creating a cron job.

assistant_id
required

Any of
Assistant Id
Type:Assistant Id
Format:uuid
The assistant ID or graph name to run. If using graph name, will default to the assistant automatically created from that graph by the server.

schedule
Type:Schedule
required
The cron schedule to execute this job on.

config
Type:Config
The configuration for the assistant.


Config
context
Type:Context
Static context added to the assistant.

end_time
Type:End Time
Format:date-time
The end date to stop running the cron.

input

Any of
array object[]
Type:array Input[]
The input to the graph.


object
interrupt_after

Any of
Interrupt After
Type:Interrupt After
enum
const:  
*
Nodes to interrupt immediately after they get executed.

*
interrupt_before

Any of
Interrupt Before
Type:Interrupt Before
enum
const:  
*
Nodes to interrupt immediately before they get executed.

*
metadata
Type:Metadata
Metadata to assign to the cron job runs.

multitask_strategy
Type:Multitask Strategy
enum
default:  
"enqueue"
Multitask strategy to use. Must be one of 'reject', 'interrupt', 'rollback', or 'enqueue'.

reject
rollback
interrupt
enqueue
webhook
Type:Webhook
min length:  
1
max length:  
65536
Format:uri-reference
Webhook to call after LangGraph API call is done.


CronSearch​Copy link
Payload for listing crons

assistant_id
Type:Assistant Id
Format:uuid
The assistant ID or graph name to filter by using exact match.

limit
Type:Limit
min:  
1
max:  
1000
default:  
10
The maximum number of results to return.

offset
Type:Offset
min:  
0
default:  
0
The number of results to skip.

select
Type:array string[]
enum
Specify which fields to return. If not provided, all fields are returned.

cron_id
assistant_id
thread_id
end_time
schedule
Show all values
sort_by
Type:Sort By
enum
default:  
"created_at"
The field to sort by.

cron_id
assistant_id
thread_id
next_run_date
end_time
created_at
updated_at
sort_order
Type:Sort Order
enum
default:  
"desc"
The order to sort by.

asc
desc
thread_id
Type:Thread Id
Format:uuid
The thread ID to search for.


CronCountRequest​Copy link
Payload for counting crons

assistant_id
Type:Assistant Id
Format:uuid
The assistant ID or graph name to search for.

thread_id
Type:Thread Id
Format:uuid
The thread ID to search for.


GraphSchema​Copy link
Defines the structure and properties of a graph.

graph_id
Type:Graph Id
enum
const:  
deepagent
required
The ID of the graph.

deepagent
state_schema
Type:State Schema
required
The schema for the graph state. Missing if unable to generate JSON schema from graph.

config_schema
Type:Config Schema
The schema for the graph config. Missing if unable to generate JSON schema from graph.

context_schema
Type:Context Schema
The schema for the graph context. Missing if unable to generate JSON schema from graph.

input_schema
Type:Input Schema
The schema for the graph input. Missing if unable to generate JSON schema from graph.

output_schema
Type:Output Schema
The schema for the graph output. Missing if unable to generate JSON schema from graph.


GraphSchemaNoId​Copy link
Defines the structure and properties of a graph without an ID.

input_schema
Type:Input Schema
required
The schema for the graph input. Missing if unable to generate JSON schema from graph.

output_schema
Type:Output Schema
required
The schema for the graph output. Missing if unable to generate JSON schema from graph.

state_schema
Type:State Schema
required
The schema for the graph state. Missing if unable to generate JSON schema from graph.

config_schema
Type:Config Schema
The schema for the graph config. Missing if unable to generate JSON schema from graph.

context_schema
Type:Context Schema
The schema for the graph context. Missing if unable to generate JSON schema from graph.


Subgraphs​Copy link
Map of graph name to graph schema metadata (input_schema, output_schema, state_schema, config_schema, context_schema).

propertyName*
Type:GraphSchemaNoId
Defines the structure and properties of a graph without an ID.

input_schema
Type:Input Schema
required
The schema for the graph input. Missing if unable to generate JSON schema from graph.

output_schema
Type:Output Schema
required
The schema for the graph output. Missing if unable to generate JSON schema from graph.

state_schema
Type:State Schema
required
The schema for the graph state. Missing if unable to generate JSON schema from graph.

config_schema
Type:Config Schema
The schema for the graph config. Missing if unable to generate JSON schema from graph.

context_schema
Type:Context Schema
The schema for the graph context. Missing if unable to generate JSON schema from graph.


Run​Copy link
assistant_id
Type:Assistant Id
Format:uuid
required
The assistant that was used for this run.

created_at
Type:Created At
Format:date-time
required
The time the run was created.

kwargs
Type:Kwargs
required
metadata
Type:Metadata
required
The run metadata.

multitask_strategy
Type:Multitask Strategy
enum
required
Strategy to handle concurrent runs on the same thread.

reject
rollback
interrupt
enqueue
run_id
Type:Run Id
Format:uuid
required
The ID of the run.

status
Type:Status
enum
required
The status of the run. One of 'pending', 'running', 'error', 'success', 'timeout', 'interrupted'.

pending
running
error
success
timeout
interrupted
thread_id
Type:Thread Id
Format:uuid
required
The ID of the thread.

updated_at
Type:Updated At
Format:date-time
required
The last time the run was updated.


Send​Copy link
A message to send to a node.

input
Type:object | array | number | string | boolean | null
required
The message to send.

node
Type:Node
required
The node to send the message to.


Command​Copy link
The command to run.

goto

Any of
Send
input
Type:Message
required
The message to send.

node
Type:Node
required
The node to send the message to.

resume
Type:object | array | number | string | boolean | null
A value to pass to an interrupted node.

update
Type:object | array | null
An update to the state.


RunCreateStateful​Copy link
Payload for creating a run.

assistant_id
required

Any of
Assistant Id
Type:Assistant Id
Format:uuid
The assistant ID or graph name to run. If using graph name, will default to first assistant created from that graph.

after_seconds
Type:After Seconds
The number of seconds to wait before starting the run. Use to schedule future runs.

checkpoint
Type:Checkpoint
The checkpoint to resume from.


Checkpoint
checkpoint_during
Type:Checkpoint During
default:  
false
Whether to checkpoint during the run.

command
Type:Command
nullable
The command to run.


Command
config
Type:Config
The configuration for the assistant.


Config
context
Type:Context
Static context added to the assistant.

feedback_keys
Type:array string[]
Feedback keys to assign to run.

if_not_exists
Type:If Not Exists
enum
default:  
"reject"
How to handle missing thread. Must be either 'reject' (raise error if missing), or 'create' (create new thread).

create
reject
input

Any of
Input
interrupt_after

Any of
Interrupt After
Type:Interrupt After
enum
const:  
*
Nodes to interrupt immediately after they get executed.

*
interrupt_before

Any of
Interrupt Before
Type:Interrupt Before
enum
const:  
*
Nodes to interrupt immediately before they get executed.

*
metadata
Type:Metadata
Metadata to assign to the run.

multitask_strategy
Type:Multitask Strategy
enum
default:  
"enqueue"
Multitask strategy to use. Must be one of 'reject', 'interrupt', 'rollback', or 'enqueue'.

reject
rollback
interrupt
enqueue
on_disconnect
Type:On Disconnect
enum
default:  
"cancel"
The disconnect mode to use. Must be one of 'cancel' or 'continue'.

cancel
continue
stream_mode

Any of
array string[]
Type:array Stream Mode[]
enum
default:  
values
The stream mode(s) to use.

values
messages
messages-tuple
tasks
checkpoints
updates
events
debug
custom
stream_resumable
Type:Stream Resumable
default:  
false
Whether to persist the stream chunks in order to resume the stream later.

stream_subgraphs
Type:Stream Subgraphs
default:  
false
Whether to stream output from subgraphs.

webhook
Type:Webhook
min length:  
1
max length:  
65536
Format:uri-reference
Webhook to call after LangGraph API call is done.


RunBatchCreate​Copy link
Type:array RunCreateStateless[]
1…
Payload for creating a batch of runs.

Payload for creating a run.


RunCreateStateless

RunCreateStateless​Copy link
Payload for creating a run.

assistant_id
required

Any of
Assistant Id
Type:Assistant Id
Format:uuid
The assistant ID or graph name to run. If using graph name, will default to first assistant created from that graph.

after_seconds
Type:After Seconds
The number of seconds to wait before starting the run. Use to schedule future runs.

checkpoint_during
Type:Checkpoint During
default:  
false
Whether to checkpoint during the run.

command
Type:Command
nullable
The command to run.


Command
config
Type:Config
The configuration for the assistant.


Config
context
Type:Context
Static context added to the assistant.

feedback_keys
Type:array string[]
Feedback keys to assign to run.

input

Any of
Input
interrupt_after

Any of
Interrupt After
Type:Interrupt After
enum
const:  
*
Nodes to interrupt immediately after they get executed.

*
interrupt_before

Any of
Interrupt Before
Type:Interrupt Before
enum
const:  
*
Nodes to interrupt immediately before they get executed.

*
metadata
Type:Metadata
Metadata to assign to the run.

on_completion
Type:On Completion
enum
default:  
"delete"
Whether to delete or keep the thread created for a stateless run. Must be one of 'delete' or 'keep'.

delete
keep
on_disconnect
Type:On Disconnect
enum
default:  
"cancel"
The disconnect mode to use. Must be one of 'cancel' or 'continue'.

cancel
continue
stream_mode

Any of
array string[]
Type:array Stream Mode[]
enum
default:  
values
The stream mode(s) to use.

values
messages
messages-tuple
tasks
checkpoints
updates
events
debug
custom
stream_resumable
Type:Stream Resumable
default:  
false
Whether to persist the stream chunks in order to resume the stream later.

stream_subgraphs
Type:Stream Subgraphs
default:  
false
Whether to stream output from subgraphs.

webhook
Type:Webhook
min length:  
1
max length:  
65536
Format:uri-reference
Webhook to call after LangGraph API call is done.


AssistantSearchRequest​Copy link
Payload for listing assistants.

graph_id
Type:Graph Id
enum
const:  
deepagent
The ID of the graph to filter by. The graph ID is normally set in your langgraph.json configuration.

deepagent
limit
Type:Limit
min:  
1
max:  
1000
default:  
10
The maximum number of results to return.

metadata
Type:Metadata
Metadata to filter by. Exact match filter for each KV pair.

offset
Type:Offset
min:  
0
default:  
0
The number of results to skip.

select
Type:array string[]
enum
Specify which fields to return. If not provided, all fields are returned.

assistant_id
graph_id
name
description
config
Show all values
sort_by
Type:Sort By
enum
The field to sort by.

assistant_id
created_at
updated_at
name
graph_id
sort_order
Type:Sort Order
enum
The order to sort by.

asc
desc

AssistantCountRequest​Copy link
Payload for counting assistants.

graph_id
Type:Graph Id
The ID of the graph to filter by. The graph ID is normally set in your langgraph.json configuration.

metadata
Type:Metadata
Metadata to filter by. Exact match filter for each KV pair.


SearchRequest​Copy link
Payload for listing assistant versions.

limit
Type:Limit
min:  
1
max:  
1000
default:  
10
The maximum number of versions to return.

metadata
Type:Metadata
Metadata to filter versions by. Exact match filter for each KV pair.

offset
Type:Offset
min:  
0
default:  
0
The number of versions to skip.


ThreadSearchRequest​Copy link
Payload for listing threads.

limit
Type:Limit
min:  
1
max:  
1000
default:  
10
Maximum number to return.

metadata
Type:Metadata
Thread metadata to filter on.

offset
Type:Offset
min:  
0
default:  
0
Offset to start from.

select
Type:array string[]
enum
Specify which fields to return. If not provided, all fields are returned.

thread_id
created_at
updated_at
metadata
config
context
status
values
interrupts
sort_by
Type:Sort By
enum
Sort by field.

thread_id
status
created_at
updated_at
sort_order
Type:Sort Order
enum
Sort order.

asc
desc
status
Type:Status
enum
Thread status to filter on.

idle
busy
interrupted
error
values
Type:Values
State values to filter on.


ThreadCountRequest​Copy link
Payload for counting threads.

metadata
Type:Metadata
Thread metadata to filter on.

status
Type:Status
enum
Thread status to filter on.

idle
busy
interrupted
error
values
Type:Values
State values to filter on.


Thread​Copy link
created_at
Type:Created At
Format:date-time
required
The time the thread was created.

metadata
Type:Metadata
required
The thread metadata.

status
Type:Status
enum
required
The status of the thread.

idle
busy
interrupted
error
thread_id
Type:Thread Id
Format:uuid
required
The ID of the thread.

updated_at
Type:Updated At
Format:date-time
required
The last time the thread was updated.

config
Type:Config
The thread config.

interrupts
Type:Interrupts
The current interrupts of the thread.

values
Type:Values
The current state of the thread.


ThreadCreate​Copy link
Payload for creating a thread.

if_exists
Type:If Exists
enum
default:  
"raise"
How to handle duplicate creation. Must be either 'raise' (raise error if duplicate), or 'do_nothing' (return existing thread).

raise
do_nothing
metadata
Type:Metadata
Metadata to add to thread.

supersteps
Type:array object[]

supersteps
thread_id
Type:Thread Id
Format:uuid
The ID of the thread. If not provided, a random UUID will be generated.

ttl
Type:TTL
The time-to-live for the thread.


TTL

ThreadPatch​Copy link
Payload for creating a thread.

metadata
Type:Metadata
Metadata to merge with existing thread metadata.


ThreadStateCheckpointRequest​Copy link
Payload for getting the state of a thread at a checkpoint.

checkpoint
Type:Checkpoint
required
The checkpoint to get the state for.


Checkpoint
subgraphs
Type:Subgraphs
Include subgraph states.


ThreadState​Copy link
checkpoint
Type:Checkpoint
required
Checkpoint config.


Checkpoint
created_at
Type:Created At
required
metadata
Type:Metadata
required
next
Type:array string[]
required
values
required

Any of
array object[]
Type:array Values[]

object
interrupts
Type:array

interrupts
parent_checkpoint
Type:Parent Checkpoint
tasks
Type:array object[]

tasks

ThreadStateSearch​Copy link
before
Type:Before
Return states before this checkpoint.


Before
checkpoint
Type:Checkpoint
Return states for this subgraph.


Checkpoint
limit
Type:Limit
min:  
1
max:  
1000
default:  
1
The maximum number of states to return.

metadata
Type:Metadata
Filter states by metadata key-value pairs.


ThreadStateUpdate​Copy link
Payload for updating the state of a thread.

as_node
Type:As Node
Update the state as if this node had just executed.

checkpoint
Type:Checkpoint
The checkpoint to update the state of.


Checkpoint
values

Any of
array
Type:array Values[]
The values to update the state with.


ThreadSuperstepUpdate​Copy link
as_node
Type:string
required
Update the state as if this node had just executed.

command
Type:Command
nullable
The command to run.


Command
values

Any of
array object[]
Type:array object[]

object

ThreadStateUpdateResponse​Copy link
Response for adding state to a thread.

checkpoint
Type:Checkpoint

CheckpointConfig​Copy link
Checkpoint config.

checkpoint_id
Type:string
Optional unique identifier for the checkpoint itself.

checkpoint_map
Type:object
Optional dictionary containing checkpoint-specific data.

checkpoint_ns
Type:string
Namespace for the checkpoint, used for organization and retrieval.

thread_id
Type:string
Unique identifier for the thread associated with this checkpoint.


StorePutRequest​Copy link
Request to store or update an item.

key
Type:Key
required
The unique identifier for the item within the namespace.

namespace
Type:array string[]
required
A list of strings representing the namespace path.

value
Type:Value
required
A dictionary containing the item's data.


StoreDeleteRequest​Copy link
Request to delete an item.

key
Type:Key
required
The unique identifier for the item.

namespace
Type:array string[]
A list of strings representing the namespace path.


StoreSearchRequest​Copy link
Request to search for items within a namespace prefix.

filter
Type:object | null
Optional dictionary of key-value pairs to filter results.


Filter
limit
Type:Limit
default:  
10
Maximum number of items to return (default is 10).

namespace_prefix
Type:array string[] | null
List of strings representing the namespace prefix.

offset
Type:Offset
default:  
0
Number of items to skip before returning results (default is 0).

query
Type:string | null
Query string for semantic/vector search.


StoreListNamespacesRequest​Copy link
limit
Type:Limit
default:  
100
Maximum number of namespaces to return (default is 100).

max_depth
Type:Max Depth
Optional integer specifying the maximum depth of namespaces to return.

offset
Type:Offset
default:  
0
Number of namespaces to skip before returning results (default is 0).

prefix
Type:array string[]
Optional list of strings representing the prefix to filter namespaces.

suffix
Type:array string[]
Optional list of strings representing the suffix to filter namespaces.


Item​Copy link
Represents a single document or data entry in the graph's Store. Items are used to store cross-thread memories.

created_at
Type:string
Format:date-time
required
The timestamp when the item was created.

key
Type:string
required
The unique identifier of the item within its namespace. In general, keys needn't be globally unique.

namespace
Type:array string[]
required
The namespace of the item. A namespace is analogous to a document's directory.

updated_at
Type:string
Format:date-time
required
The timestamp when the item was last updated.

value
Type:object
required
The value stored in the item. This is the document itself.


RunsCancel​Copy link

One of
RunsCancel
status
Type:Status
enum
required
Filter runs by status to cancel. Must be one of 'pending', 'running', or 'all'.

pending
running
all
run_ids
Type:array Run Ids[]
List of run IDs to cancel.

thread_id
Type:Thread Id
Format:uuid
The ID of the thread containing runs to cancel.


SearchItemsResponse​Copy link
items
Type:array object[]
required
Represents a single document or data entry in the graph's Store. Items are used to store cross-thread memories.


items

ListNamespaceResponse​Copy link
Type:array array string[][]

ErrorResponse​Copy link
Type:ErrorResponse
Error message returned from the server