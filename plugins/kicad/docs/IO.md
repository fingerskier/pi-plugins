# Polling

the agent can periodically query board state via get_footprints(), get_selection(), track lists, etc. and diff against previous state.
- do this when first loading a project
- could also be an MCP prompt to "refresh" the agent's state
- or a "review" tool that updates the agent's state


# Selections

the user selects something in the UI, the agent reads the selection via get_selection() / add_to_selection(), and acts on it.
- there should be an MCP prompt for this


# 