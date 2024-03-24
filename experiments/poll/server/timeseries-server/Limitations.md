# Timeseries-server limitations
## Output directory structure
Right now, files are saved in one big folder (the output folder).
The contents of this folder are read and used to search for the correct
file to read from or write to. This means that the list of filenames
is entirely stored in an array. Since the filenames are ISO 8601
timestamps, the directory can be read alphabetically and the files
will automatically be sorted in time, allowing for a binary (O(log n))
search.

For most use cases, this design is efficient enough. An ISO 8601
timestamp contains 20 characters, so a filename is (roughly) 20 bytes.
This means that for the array of filenames to take up 1 MB, more than
50000 files need to be present in the output directory.

However, if experiments are conducted using very frequent updates and
very small file sizes, this array of filenames might still grow too
quickly, and a more sophisticated design could be required.