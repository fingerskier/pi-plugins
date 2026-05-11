"""SKiDL MCP Server - Design electronic circuits with Claude.

Importing the upstream ``skidl`` package eagerly installs file handlers on
its loggers that write ``<script>.log`` and ``<script>.erc`` into the
current working directory at module-load time. When this plugin is
auto-loaded by Pi those files end up scattered across whatever directory
the user happened to launch Pi from, even if no SKiDL tool is ever used.

We resolve that by importing ``stop_log_file_output`` here -- which has the
side effect of importing ``skidl`` and provoking the unwanted file
handlers -- and then immediately invoking it. ``stop_log_file_output``
detaches the file handlers and deletes the files they may already have
created. Subsequent SKiDL log/ERC output still flows to ``stderr`` via the
streaming handlers the plugin keeps.
"""

from __future__ import annotations

from skidl.logger import stop_log_file_output as _stop_log_file_output

# Side-effect cleanup: remove the ``skidl.log`` / ``skidl.erc`` files (and
# their underlying file handlers) that ``import skidl`` just dropped into
# the current working directory.
_stop_log_file_output()

__version__ = "0.1.1"

__all__ = ["__version__"]
