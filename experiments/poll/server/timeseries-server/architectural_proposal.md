# Classes
### Filesystem
This class is responsible for storing and fetching data from disk. It should
provide at least the following methods:
- `getFile(timestamp)`: Gets the name of the file containing entries of
 `timestamp` (where `timestamp` is a UTC UNIX timestamp).
- `getFileContents(filename)`: gets the contents of `filename` if this file
is present. (NOTE: Should this return a triple stream or should
triple parsing be delegated to the caller?)
- `writeEntry(triples)`: Writes a set of triples to disk (automatically choosing
the appropriate file based on the current time)
- `getPrevious(filename)`: Gets the previous file for `filename` (`filename`
should be present in the file system).
- `getNext(filename)`: Gets the next file for `filename` (`filename`
should be present in the file system).

### Router
Routes requests and provides the correct response. Subroutes are specified
 in `config.json` (see further). Routes are:
- `entry`: This entry point redirects to the most recent fragment
(the file containing the most recent entries) using a 302 response.
- `fragment/TIMESTAMP`: returns the contents of the file created at
`TIMESTAMP`, where `TIMESTAMP` is in the ISO 8601 format representing UTC time.
Returns 404 if no such file is present.

NOTE: should we provide an entry point to get the relevant file for an arbitrary
timestamp (like the `?time=` argument in
 [smartflanders-backend](https://github.com/oSoc17/smartflanders-backend))
 or do we delegate this task to another service (eg rangegates)?

### (Name unspecified)
This class should listen to STDIN (the pipe through which data gets fed) and
call the filesystem to store any received triples.

# Files
### Config
- If a config file is passed using the `-c` flag, this file will be used
- If no `-c` flag is passed, `timeseries-server` looks for a `config.json`
in the current directory.
- If no `config.json` is found, default values for config fields are used.

Any fields not present in `config.json` will be instantiated to default
values. `config.json` can contain the following fields:

```js
{
    'maxFileSize': int (default: 500000)
    'outputDir': string (default: 'out')
    'staticData': string (default: '')
    'entry': string (default '/entry')
    'fragment': string (default '/fragment')
}
```

### Data
#### Output data
Data is stored in the `outputDir` specified in `config.json`.
Each file contains a set of triples. The filename is the UTC UNIX timestamp
of the first entry in the file (when the file was created).

Finding a relevant file happens by reading the directory and performing a
binary search on the resulting array, rather than using a linked
system as in [smartflanders-backend](https://github.com/oSoc17/smartflanders-backend).

Simple benchmark tests have concluded that all operations on an array
smaller than 1MB happen nearly instantaniously. If each file spans 1 hour
of data, it would take more than 28 years for the array of filenames
to take up 1MB in size. This approach provides a much more robust system,
as it is immune to data holes and timezone or daylight savings time problems.

#### Static data
`timeseries-server` looks for static (unchanging) data in the `staticData`
file specified in `config.json`. This file should contain triples in
any of the following formats: Turtle, TriG, N-Triples, N-Quads, Notation3 (N3).
If this file is found, the triples in the file will be added to all responses
of the server. If the variable is the empty string, no static data will be searched.

It should be possible to update this file while the server is running.
Several options are possible:
- Simply change the file on disk. Requires no extra support, but requires
access to the machine on which the server is deployed.
- Enable a `PUT` entry point to modify the static data. Does not require
access to the machine, but requires authentication through HTTP and extra
caution for vulnerabilities.

NOTE: Any other mechanisms... ?