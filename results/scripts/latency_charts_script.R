library(readr) 
library(dplyr)
library(ggplot2)
library(ggridges)

# Function to read and combine CVS files
readCSVs = function (path) {
  list.files(path, full.names = TRUE) %>% lapply(read_csv, skip=1, col_names=FALSE) %>% bind_rows(); 
}

# Load Polling latency data
pollsnf2c5 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/5/");
pollsnf2c5$Clients <- "5"
pollsnf2c10 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/10/");
pollsnf2c10$Clients <- "10"
pollsnf2c20 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/20/");
pollsnf2c20$Clients <- "20"
pollsnf2c30 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/30/");
pollsnf2c30$Clients <- "30"
pollsnf2c40 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/40/");
pollsnf2c40$Clients <- "40"
pollsnf2c50 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/50/");
pollsnf2c50$Clients <- "50"
pollsnf2c100 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/100/");
pollsnf2c100$Clients <- "100"
pollsnf2c150 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/150/");
pollsnf2c150$Clients <- "150"
pollsnf2c200 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/poll/stable_network/client/f2000/200/");
pollsnf2c200$Clients <- "200"

# Combine all Polling data frames into one data frame
pollsnf2 = bind_rows(pollsnf2c5, pollsnf2c10, pollsnf2c20, pollsnf2c30, pollsnf2c40, pollsnf2c50, pollsnf2c100, pollsnf2c150, pollsnf2c200)
# Plot the data as a density ridges
ggplot(pollsnf2, aes(x = X7, y = Clients)) + geom_density_ridges(scale = 0.9, fill = "#0072B2") + scale_y_discrete(limits=c("5","10","20","30","40","50","100","150","200")) + labs(x = "Latency (ms)") + xlim(0, 1250) + theme(axis.text=element_text(size = 18), axis.title=element_text(size = 24))


# Load Pubsub latency data
pubsubsnf2c5 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/5/");
pubsubsnf2c5$Clients <- "5"
pubsubsnf2c10 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/10/");
pubsubsnf2c10$Clients <- "10"
pubsubsnf2c20 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/20/");
pubsubsnf2c20$Clients <- "20"
pubsubsnf2c30 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/30/");
pubsubsnf2c30$Clients <- "30"
pubsubsnf2c40 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/40/");
pubsubsnf2c40$Clients <- "40"
pubsubsnf2c50 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/50/");
pubsubsnf2c50$Clients <- "50"
pubsubsnf2c100 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/100/");
pubsubsnf2c100$Clients <- "100"
pubsubsnf2c150 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/150/");
pubsubsnf2c150$Clients <- "150"
pubsubsnf2c200 = readCSVs("/home/julian/Desktop/real-time-document-benchmark/results/pubsub/stable_network/client/f2000/200/");
pubsubsnf2c200$Clients <- "200"

# Combine all Pubsub data frames into one data frame
pubsubsnf2 = bind_rows(pubsubsnf2c5, pubsubsnf2c10, pubsubsnf2c20, pubsubsnf2c30, pubsubsnf2c40, pubsubsnf2c50, pubsubsnf2c100, pubsubsnf2c150, pubsubsnf2c200)
# Plot the data as a density ridges
ggplot(pubsubsnf2, aes(x = X7, y = Clients)) + geom_density_ridges(scale = 0.9, fill = "#E69F00") + scale_y_discrete(limits=c("5","10","20","30","40","50","100","150","200")) + labs(x = "Latency (ms)") + xlim(0, 1250) + theme(axis.text=element_text(size = 18), axis.title=element_text(size = 24))